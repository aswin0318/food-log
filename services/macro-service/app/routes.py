from datetime import date, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware import get_current_user
from app.models import DailySummaryCache, MacroTarget
from app.schemas import (
    DailyComparisonResponse,
    DailySummaryResponse,
    MacroTargetResponse,
    MessageResponse,
    UpdateTargetsRequest,
    OnboardUserRequest,
    WeeklySummaryResponse,
)

settings = get_settings()
router = APIRouter(prefix="/api/macro", tags=["Macro Calculation"])


def _get_auth_header(request: Request) -> dict:
    """Extract authorization header from the incoming request to forward."""
    auth = request.headers.get("authorization", "")
    cookies = request.cookies
    headers = {}
    if auth:
        headers["Authorization"] = auth
    return headers


async def _fetch_daily_meals(
    target_date: date, request: Request
) -> dict:
    """Fetch daily meals from the food service."""
    headers = _get_auth_header(request)
    cookie_token = request.cookies.get("access_token")
    cookies = {"access_token": cookie_token} if cookie_token else {}

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.FOOD_SERVICE_URL}/api/food/meals/daily/{target_date.isoformat()}",
            headers=headers,
            cookies=cookies,
            timeout=10.0,
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Food service error: {resp.text}",
            )
        return resp.json()


def _determine_status(actual: float, target: float, macro_type: str) -> str:
    """Determine compliance status for a macro."""
    if target == 0:
        return "ok"
    percentage = (actual / target) * 100

    if macro_type == "calories":
        if percentage > 120:
            return "surplus"
        elif percentage < 70:
            return "deficit"
        return "ok"
    elif macro_type == "protein":
        if percentage < 80:
            return "deficient"
        elif percentage > 150:
            return "excess"
        return "ok"
    else:  # carbs, fat
        if percentage > 130:
            return "excess"
        elif percentage < 60:
            return "deficient"
        return "ok"


@router.get("/daily/{target_date}", response_model=DailySummaryResponse)
async def get_daily_summary(
    target_date: date,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Compute daily macro totals by fetching meals from food-service."""
    data = await _fetch_daily_meals(target_date, request)

    summary = DailySummaryResponse(
        date=target_date.isoformat(),
        total_calories=data.get("total_calories", 0),
        total_protein=data.get("total_protein", 0),
        total_carbs=data.get("total_carbs", 0),
        total_fat=data.get("total_fat", 0),
        meal_count=data.get("meal_count", 0),
    )

    # Cache the summary
    existing = await db.execute(
        select(DailySummaryCache).where(
            DailySummaryCache.user_id == current_user["user_id"],
            DailySummaryCache.date == target_date,
        )
    )
    cache_entry = existing.scalar_one_or_none()

    if cache_entry:
        cache_entry.total_calories = summary.total_calories
        cache_entry.total_protein = summary.total_protein
        cache_entry.total_carbs = summary.total_carbs
        cache_entry.total_fat = summary.total_fat
        cache_entry.meal_count = summary.meal_count
    else:
        cache_entry = DailySummaryCache(
            user_id=current_user["user_id"],
            date=target_date,
            total_calories=summary.total_calories,
            total_protein=summary.total_protein,
            total_carbs=summary.total_carbs,
            total_fat=summary.total_fat,
            meal_count=summary.meal_count,
        )
        db.add(cache_entry)

    return summary


@router.get("/weekly", response_model=WeeklySummaryResponse)
async def get_weekly_summary(
    start_date: date = Query(...),
    request: Request = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Compute weekly macro summary (7 days starting from start_date)."""
    daily_breakdowns = []
    total_meals = 0

    for i in range(7):
        day = start_date + timedelta(days=i)
        try:
            data = await _fetch_daily_meals(day, request)
            summary = DailySummaryResponse(
                date=day.isoformat(),
                total_calories=data.get("total_calories", 0),
                total_protein=data.get("total_protein", 0),
                total_carbs=data.get("total_carbs", 0),
                total_fat=data.get("total_fat", 0),
                meal_count=data.get("meal_count", 0),
            )
        except HTTPException:
            summary = DailySummaryResponse(
                date=day.isoformat(),
                total_calories=0,
                total_protein=0,
                total_carbs=0,
                total_fat=0,
                meal_count=0,
            )
        daily_breakdowns.append(summary)
        total_meals += summary.meal_count

    # Compute averages
    days_with_data = len([d for d in daily_breakdowns if d.meal_count > 0]) or 1
    avg_summary = DailySummaryResponse(
        date="average",
        total_calories=round(
            sum(d.total_calories for d in daily_breakdowns) / days_with_data, 1
        ),
        total_protein=round(
            sum(d.total_protein for d in daily_breakdowns) / days_with_data, 1
        ),
        total_carbs=round(
            sum(d.total_carbs for d in daily_breakdowns) / days_with_data, 1
        ),
        total_fat=round(
            sum(d.total_fat for d in daily_breakdowns) / days_with_data, 1
        ),
        meal_count=round(total_meals / days_with_data),
    )

    end_date = start_date + timedelta(days=6)

    return WeeklySummaryResponse(
        start_date=start_date.isoformat(),
        end_date=end_date.isoformat(),
        daily_breakdowns=daily_breakdowns,
        weekly_averages=avg_summary,
        total_meals=total_meals,
    )


@router.get("/targets", response_model=MacroTargetResponse)
async def get_targets(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's macro targets."""
    result = await db.execute(
        select(MacroTarget).where(
            MacroTarget.user_id == current_user["user_id"]
        )
    )
    target = result.scalar_one_or_none()

    if not target:
        # Return defaults
        return MacroTargetResponse(
            user_id=current_user["user_id"],
            daily_calorie_target=2000,
            daily_protein_target=150,
            daily_carbs_target=250,
            daily_fat_target=65,
        )

    return MacroTargetResponse.model_validate(target)


@router.post("/onboard", response_model=MacroTargetResponse)
async def onboard_user(
    body: OnboardUserRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Calculate and set macro targets based on physical metrics and goal."""
    # 1. Calculate BMR (Mifflin-St Jeor)
    # Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
    # Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
    if body.gender == "male":
        bmr = (10 * body.weight) + (6.25 * body.height) - (5 * body.age) + 5
    else:
        bmr = (10 * body.weight) + (6.25 * body.height) - (5 * body.age) - 161

    # 2. Activity Multipliers
    activity_multipliers = {
        "sedentary": 1.2,
        "lightly_active": 1.375,
        "moderately_active": 1.55,
        "very_active": 1.725,
        "extra_active": 1.9,
    }
    tdee = bmr * activity_multipliers.get(body.activity_level, 1.2)

    # 3. Apply Goal
    if body.goal == "bulking":
        target_cals = tdee + 200
    elif body.goal == "cutting":
        target_cals = tdee - 200
    else:
        target_cals = tdee

    target_cals = max(1200, int(target_cals))  # Minimum floor

    # 4. Calculate Macros
    # Protein: 2g per kg bodyweight
    protein = int(2.0 * body.weight)
    # Fat: 1g per kg bodyweight
    fat = int(1.0 * body.weight)
    
    # Carbs: Remaining calories / 4
    protein_cals = protein * 4
    fat_cals = fat * 9
    remaining_cals = target_cals - (protein_cals + fat_cals)
    carbs = max(50, int(remaining_cals / 4))

    # Save to database
    result = await db.execute(
        select(MacroTarget).where(
            MacroTarget.user_id == current_user["user_id"]
        )
    )
    target = result.scalar_one_or_none()

    if target:
        target.height = body.height
        target.weight = body.weight
        target.age = body.age
        target.gender = body.gender
        target.goal = body.goal
        target.activity_level = body.activity_level
        target.daily_calorie_target = target_cals
        target.daily_protein_target = protein
        target.daily_carbs_target = carbs
        target.daily_fat_target = fat
    else:
        target = MacroTarget(
            user_id=current_user["user_id"],
            height=body.height,
            weight=body.weight,
            age=body.age,
            gender=body.gender,
            goal=body.goal,
            activity_level=body.activity_level,
            daily_calorie_target=target_cals,
            daily_protein_target=protein,
            daily_carbs_target=carbs,
            daily_fat_target=fat,
        )
        db.add(target)

    await db.flush()
    await db.refresh(target)

    return MacroTargetResponse.model_validate(target)


@router.put("/targets", response_model=MacroTargetResponse)
async def update_targets(
    body: UpdateTargetsRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the user's macro targets."""
    result = await db.execute(
        select(MacroTarget).where(
            MacroTarget.user_id == current_user["user_id"]
        )
    )
    target = result.scalar_one_or_none()

    if target:
        target.daily_calorie_target = body.daily_calorie_target
        target.daily_protein_target = body.daily_protein_target
        target.daily_carbs_target = body.daily_carbs_target
        target.daily_fat_target = body.daily_fat_target
    else:
        target = MacroTarget(
            user_id=current_user["user_id"],
            daily_calorie_target=body.daily_calorie_target,
            daily_protein_target=body.daily_protein_target,
            daily_carbs_target=body.daily_carbs_target,
            daily_fat_target=body.daily_fat_target,
        )
        db.add(target)

    await db.flush()
    await db.refresh(target)

    return MacroTargetResponse.model_validate(target)


@router.get("/comparison/{target_date}", response_model=DailyComparisonResponse)
async def get_daily_comparison(
    target_date: date,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Compare actual intake vs targets for a specific date."""
    # Get daily summary
    data = await _fetch_daily_meals(target_date, request)

    actual = DailySummaryResponse(
        date=target_date.isoformat(),
        total_calories=data.get("total_calories", 0),
        total_protein=data.get("total_protein", 0),
        total_carbs=data.get("total_carbs", 0),
        total_fat=data.get("total_fat", 0),
        meal_count=data.get("meal_count", 0),
    )

    # Get targets
    result = await db.execute(
        select(MacroTarget).where(
            MacroTarget.user_id == current_user["user_id"]
        )
    )
    target_record = result.scalar_one_or_none()

    target = MacroTargetResponse(
        user_id=current_user["user_id"],
        daily_calorie_target=target_record.daily_calorie_target if target_record else 2000,
        daily_protein_target=target_record.daily_protein_target if target_record else 150,
        daily_carbs_target=target_record.daily_carbs_target if target_record else 250,
        daily_fat_target=target_record.daily_fat_target if target_record else 65,
    )

    # Compute percentages
    cal_pct = round((actual.total_calories / target.daily_calorie_target * 100), 1) if target.daily_calorie_target else 0
    pro_pct = round((actual.total_protein / target.daily_protein_target * 100), 1) if target.daily_protein_target else 0
    carb_pct = round((actual.total_carbs / target.daily_carbs_target * 100), 1) if target.daily_carbs_target else 0
    fat_pct = round((actual.total_fat / target.daily_fat_target * 100), 1) if target.daily_fat_target else 0

    return DailyComparisonResponse(
        date=target_date.isoformat(),
        actual=actual,
        target=target,
        calorie_percentage=cal_pct,
        protein_percentage=pro_pct,
        carbs_percentage=carb_pct,
        fat_percentage=fat_pct,
        calorie_status=_determine_status(actual.total_calories, target.daily_calorie_target, "calories"),
        protein_status=_determine_status(actual.total_protein, target.daily_protein_target, "protein"),
        carbs_status=_determine_status(actual.total_carbs, target.daily_carbs_target, "carbs"),
        fat_status=_determine_status(actual.total_fat, target.daily_fat_target, "fat"),
    )


@router.get("/health", response_model=MessageResponse)
async def health_check():
    """Health check endpoint."""
    return MessageResponse(message="Macro service is healthy")
