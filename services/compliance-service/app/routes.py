from datetime import date, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware import get_current_user
from app.models import Alert, ComplianceCheck
from app.schemas import (
    AlertListResponse,
    AlertResponse,
    ComplianceCheckResponse,
    MessageResponse,
    PatternAnalysisResponse,
)

settings = get_settings()
router = APIRouter(prefix="/api/compliance", tags=["Compliance & Alerts"])


def _get_auth_header(request: Request) -> dict:
    """Extract authorization header from the incoming request to forward."""
    auth = request.headers.get("authorization", "")
    headers = {}
    if auth:
        headers["Authorization"] = auth
    return headers


async def _fetch_comparison(target_date: date, request: Request) -> dict:
    """Fetch daily comparison from macro service."""
    headers = _get_auth_header(request)
    cookie_token = request.cookies.get("access_token")
    cookies = {"access_token": cookie_token} if cookie_token else {}

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.MACRO_SERVICE_URL}/api/macro/comparison/{target_date.isoformat()}",
            headers=headers,
            cookies=cookies,
            timeout=15.0,
        )
        if resp.status_code == 404:
            return None
        if resp.status_code != 200:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Macro service error: {resp.text}",
            )
        return resp.json()


def _generate_alerts(
    user_id, target_date: date, comparison: dict
) -> list[Alert]:
    """Generate alerts based on compliance check results."""
    alerts = []

    goal = comparison.get("target", {}).get("goal", "maintaining")
    meal_count = comparison.get("actual", {}).get("meal_count", 0)

    # Protein deficiency
    if comparison.get("protein_status") == "deficient":
        pct = comparison.get("protein_percentage", 0)
        alerts.append(Alert(
            user_id=user_id,
            alert_type="protein_deficiency",
            severity="warning" if pct >= 60 else "critical",
            title="Protein Deficiency Detected",
            message=(
                f"Your protein intake on {target_date.isoformat()} was only "
                f"{pct}% of your target. Consider adding protein-rich foods "
                f"like chicken, fish, eggs, or legumes."
            ),
            date=target_date,
            metadata_json={
                "actual_percentage": pct,
                "threshold": settings.PROTEIN_DEFICIENCY_PCT,
                "macro_type": "protein",
            },
        ))

    # Calorie surplus
    if comparison.get("calorie_status") == "surplus":
        pct = comparison.get("calorie_percentage", 0)
        severity = "critical" if goal == "cutting" else ("warning" if pct <= 140 else "critical")
        alerts.append(Alert(
            user_id=user_id,
            alert_type="calorie_surplus",
            severity=severity,
            title="Calorie Surplus Alert",
            message=(
                f"Your calorie intake on {target_date.isoformat()} was "
                f"{pct}% of your target — a surplus of {round(pct - 100, 1)}%. "
                f"Consider reducing portion sizes or avoiding high-calorie snacks."
            ),
            date=target_date,
            metadata_json={
                "actual_percentage": pct,
                "threshold": settings.CALORIE_SURPLUS_PCT,
                "macro_type": "calories",
            },
        ))

    # Calorie deficit
    if comparison.get("calorie_status") == "deficit":
        pct = comparison.get("calorie_percentage", 0)
        severity = "critical" if goal == "bulking" else ("warning" if pct >= 50 else "critical")
        alerts.append(Alert(
            user_id=user_id,
            alert_type="calorie_deficit",
            severity=severity,
            title="Calorie Deficit Warning",
            message=(
                f"Your calorie intake on {target_date.isoformat()} was only "
                f"{pct}% of your target. You may not be eating enough to "
                f"sustain your activity level."
            ),
            date=target_date,
            metadata_json={
                "actual_percentage": pct,
                "threshold": settings.CALORIE_DEFICIT_PCT,
                "macro_type": "calories",
            },
        ))
        
    # Meal frequency for bulking
    if goal == "bulking" and 0 < meal_count < 5:
        alerts.append(Alert(
            user_id=user_id,
            alert_type="meal_frequency_warning",
            severity="warning",
            title="Increase Meal Frequency",
            message=(
                f"You only logged {meal_count} meals on {target_date.isoformat()}. "
                f"Since your goal is bulking, try to eat at least 5 times a day to maintain your surplus."
            ),
            date=target_date,
            metadata_json={
                "actual_meals": meal_count,
                "target_meals": 5,
            },
        ))
    return alerts

async def _generate_time_reminders(user_id, comparison, db: AsyncSession):
    """Generate time-based reminders for calorie intake."""
    try:
        from datetime import datetime
        now = datetime.now()
        hour = now.hour
        today = now.date()
        
        # Slots
        slots = {
            8: ("Morning Reminder", "morning_reminder"),
            13: ("Noon Reminder", "noon_reminder"),
            19: ("Evening Reminder", "evening_reminder"),
            22: ("Night Summary", "night_reminder")
        }
        
        if hour not in slots:
            return
            
        title, alert_type = slots[hour]
        
        # Check if already generated today
        from sqlalchemy import select, and_
        result = await db.execute(
            select(Alert).where(
                and_(
                    Alert.user_id == user_id,
                    Alert.alert_type == alert_type,
                    Alert.date == today
                )
            )
        )
        if result.scalar_one_or_none():
            return

        target_cals = comparison.get("target", {}).get("daily_calorie_target", 2000)
        actual_cals = comparison.get("actual", {}).get("total_calories", 0)
        remaining = target_cals - actual_cals
        
        message = f"It's {title.split()[0]}! You have {max(0, int(remaining))} calories left to reach your goal of {target_cals} kcal."
        if remaining < 0:
            message = f"It's {title.split()[0]}! You've already reached your calorie goal for today."

        alert = Alert(
            user_id=user_id,
            alert_type=alert_type,
            severity="info",
            title=title,
            message=message,
            date=today,
            metadata_json={"remaining_calories": remaining, "current_hour": hour}
        )
        db.add(alert)
    except Exception as e:
        print(f"Error generating reminder: {e}")



@router.get("/check/{target_date}", response_model=ComplianceCheckResponse)
async def check_compliance(
    target_date: date,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Run a compliance check for a specific date."""
    comparison = await _fetch_comparison(target_date, request)
    if not comparison:
        raise HTTPException(
            status_code=404,
            detail=f"No meals logged on {target_date.isoformat()}. Please log a meal before running analysis."
        )

    # Generate time-based reminders only for today
    if target_date == date.today():
        await _generate_time_reminders(current_user["user_id"], comparison, db)

    protein_status = comparison.get("protein_status", "ok")
    calorie_status = comparison.get("calorie_status", "ok")
    carbs_status = comparison.get("carbs_status", "ok")
    fat_status = comparison.get("fat_status", "ok")

    overall_compliant = all(
        s == "ok" for s in [protein_status, calorie_status, carbs_status, fat_status]
    )

    # Upsert compliance check
    existing = await db.execute(
        select(ComplianceCheck).where(
            and_(
                ComplianceCheck.user_id == current_user["user_id"],
                ComplianceCheck.date == target_date,
            )
        )
    )
    check = existing.scalar_one_or_none()

    if check:
        check.protein_status = protein_status
        check.calorie_status = calorie_status
        check.carbs_status = carbs_status
        check.fat_status = fat_status
        check.overall_compliant = overall_compliant
        check.details = comparison
    else:
        check = ComplianceCheck(
            user_id=current_user["user_id"],
            date=target_date,
            protein_status=protein_status,
            calorie_status=calorie_status,
            carbs_status=carbs_status,
            fat_status=fat_status,
            overall_compliant=overall_compliant,
            details=comparison,
        )
        db.add(check)

    # Generate daily alerts
    alerts = _generate_alerts(current_user["user_id"], target_date, comparison)
    for alert in alerts:
        # Check for duplicates to avoid spamming the same alert
        dup = await db.execute(
            select(Alert).where(
                and_(
                    Alert.user_id == current_user["user_id"],
                    Alert.alert_type == alert.alert_type,
                    Alert.date == target_date,
                )
            )
        )
        if not dup.scalar_one_or_none():
            db.add(alert)

    await db.flush()
    await db.refresh(check)

    return ComplianceCheckResponse.model_validate(check)


@router.get("/alerts", response_model=AlertListResponse)
async def get_alerts(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all alerts for the current user."""
    base_query = select(Alert).where(Alert.user_id == current_user["user_id"])

    # Count total
    count_result = await db.execute(
        select(func.count()).select_from(base_query.subquery())
    )
    total = count_result.scalar() or 0

    # Count unread
    unread_result = await db.execute(
        select(func.count()).where(
            and_(
                Alert.user_id == current_user["user_id"],
                Alert.is_read == False,
            )
        )
    )
    unread_count = unread_result.scalar() or 0

    # Fetch paginated
    result = await db.execute(
        base_query.order_by(Alert.created_at.desc()).limit(limit).offset(offset)
    )
    alerts = result.scalars().all()

    return AlertListResponse(
        alerts=[AlertResponse.model_validate(a) for a in alerts],
        total=total,
        unread_count=unread_count,
    )


@router.get("/alerts/unread", response_model=AlertListResponse)
async def get_unread_alerts(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get unread alerts for the current user."""
    result = await db.execute(
        select(Alert).where(
            and_(
                Alert.user_id == current_user["user_id"],
                Alert.is_read == False,
            )
        ).order_by(Alert.created_at.desc())
    )
    alerts = result.scalars().all()

    return AlertListResponse(
        alerts=[AlertResponse.model_validate(a) for a in alerts],
        total=len(alerts),
        unread_count=len(alerts),
    )


@router.put("/alerts/{alert_id}/read", response_model=AlertResponse)
async def mark_alert_read(
    alert_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark an alert as read."""
    from uuid import UUID as PyUUID
    try:
        parsed_id = PyUUID(alert_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid alert ID")

    result = await db.execute(
        select(Alert).where(
            and_(
                Alert.id == parsed_id,
                Alert.user_id == current_user["user_id"],
            )
        )
    )
    alert = result.scalar_one_or_none()

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    alert.is_read = True
    await db.flush()
    await db.refresh(alert)

    return AlertResponse.model_validate(alert)


@router.post("/analyze", response_model=PatternAnalysisResponse)
async def analyze_patterns(
    days: int = Query(7, ge=3, le=30),
    request: Request = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Analyze multi-day patterns for compliance issues."""
    from datetime import date as date_type, datetime
    today = date_type.today()
    now = datetime.now()
    patterns_found = []
    alerts_generated = 0

    # Fetch comparison data for each day
    daily_results = []
    total_cals = 0
    total_protein = 0
    logged_days = 0
    
    target_cals = 2000 # Default fallback
    target_protein = 150
    goal = "maintaining"
    
    missing_logs = []
    yet_to_log = []

    # Standard meal times
    MEAL_SLOTS = {
        "Breakfast": (6, 10),
        "Lunch": (12, 15),
        "Dinner": (19, 22)
    }

    for i in range(days):
        day = today - timedelta(days=i)
        try:
            comparison = await _fetch_comparison(day, request)
            if comparison:
                logged_days += 1
                total_cals += comparison["actual"]["total_calories"]
                total_protein += comparison["actual"]["total_protein"]
                
                # Update targets from the most recent comparison
                target_cals = comparison["target"]["daily_calorie_target"]
                target_protein = comparison["target"]["daily_protein_target"]
                goal = comparison["target"]["goal"]
                
                meal_count = comparison.get("actual", {}).get("meal_count", 0)
                if meal_count == 0:
                    missing_logs.append({"date": day.isoformat(), "status": "Missed to log whole day"})
                elif meal_count < 3:
                     missing_logs.append({"date": day.isoformat(), "status": f"Partial logs ({meal_count} meals)"})
                
                daily_results.append({"date": day, "data": comparison})
            else:
                missing_logs.append({"date": day.isoformat(), "status": "Missed"})
                daily_results.append({"date": day, "data": None})
        except HTTPException:
            missing_logs.append({"date": day.isoformat(), "status": "No data found"})
            daily_results.append({"date": day, "data": None})

    # Check "Yet to Log" for today based on current time
    current_hour = now.hour
    for slot_name, (start, end) in MEAL_SLOTS.items():
        if current_hour < start:
            yet_to_log.append(slot_name)

    # Calculate averages based on LOGGED days
    avg_cals = round(total_cals / logged_days, 1) if logged_days > 0 else 0
    avg_protein = round(total_protein / logged_days, 1) if logged_days > 0 else 0
    
    # Determine "On Track" status
    status = "On Track"
    cal_diff_pct = (avg_cals / target_cals * 100) if target_cals > 0 else 100
    
    if goal == "cutting" and cal_diff_pct > 110:
        status = "Above Target (Surplus)"
    elif goal == "bulking" and cal_diff_pct < 90:
        status = "Below Target (Deficit)"
    elif goal == "maintaining" and (cal_diff_pct > 115 or cal_diff_pct < 85):
        status = "Off Track"

    averages = {
        "avg_calories": avg_cals,
        "avg_protein": avg_protein,
        "logged_days": logged_days,
        "missed_days": days - logged_days,
        "status": status,
        "target_calories": target_cals,
        "target_protein": target_protein
    }

    # Detect trends
    if logged_days >= 3:
        consecutive_protein = 0
        for result in daily_results:
            if result["data"] and result["data"].get("protein_status") == "deficient":
                consecutive_protein += 1
            else:
                if consecutive_protein >= 3:
                    patterns_found.append({
                        "type": "protein_deficiency_trend",
                        "days": consecutive_protein,
                        "severity": "critical",
                        "message": f"Protein targets missed for {consecutive_protein} days."
                    })
                consecutive_protein = 0

    # Generate pattern alerts
    for pattern in patterns_found:
        alert = Alert(
            user_id=current_user["user_id"],
            alert_type="pattern_detected",
            severity=pattern["severity"],
            title=f"Trend: {pattern['type'].replace('_', ' ').title()}",
            message=pattern["message"],
            date=today,
            metadata_json=pattern,
        )
        db.add(alert)
        alerts_generated += 1

    return PatternAnalysisResponse(
        analyzed_days=days,
        patterns_found=patterns_found,
        alerts_generated=alerts_generated,
        message=f"Logged Day Analysis: {logged_days}/{days} days analyzed.",
        weekly_averages=averages,
        missing_logs=missing_logs,
        yet_to_log=yet_to_log
    )


@router.get("/health", response_model=MessageResponse)
async def health_check():
    """Health check endpoint."""
    return MessageResponse(message="Compliance service is healthy")
