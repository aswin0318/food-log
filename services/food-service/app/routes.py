from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware import get_current_user
from app.models import Meal
from app.schemas import (
    DailyMealsResponse,
    MealCreateRequest,
    MealListResponse,
    MealResponse,
    MealUpdateRequest,
    MessageResponse,
)

router = APIRouter(prefix="/api/food", tags=["Food Logging"])


@router.post(
    "/meals",
    response_model=MealResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_meal(
    body: MealCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Log a new meal."""
    meal = Meal(
        user_id=current_user["user_id"],
        name=body.name,
        meal_type=body.meal_type.value,
        calories=body.calories,
        protein=body.protein,
        carbs=body.carbs,
        fat=body.fat,
        logged_at=body.logged_at or datetime.now(timezone.utc),
    )
    db.add(meal)
    await db.flush()
    await db.refresh(meal)
    return MealResponse.model_validate(meal)


@router.get("/meals", response_model=MealListResponse)
async def list_meals(
    date_filter: date | None = Query(None, alias="date"),
    meal_type: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List meals for the current user with optional filters."""
    query = select(Meal).where(Meal.user_id == current_user["user_id"])

    if date_filter:
        query = query.where(cast(Meal.logged_at, Date) == date_filter)

    if meal_type:
        query = query.where(Meal.meal_type == meal_type)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch paginated results
    query = query.order_by(Meal.logged_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    meals = result.scalars().all()

    return MealListResponse(
        meals=[MealResponse.model_validate(m) for m in meals],
        total=total,
    )


@router.get("/meals/daily/{target_date}", response_model=DailyMealsResponse)
async def get_daily_meals(
    target_date: date,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all meals for a specific date with totals."""
    query = select(Meal).where(
        and_(
            Meal.user_id == current_user["user_id"],
            cast(Meal.logged_at, Date) == target_date,
        )
    ).order_by(Meal.logged_at.asc())

    result = await db.execute(query)
    meals = result.scalars().all()

    meal_responses = [MealResponse.model_validate(m) for m in meals]

    return DailyMealsResponse(
        date=target_date.isoformat(),
        meals=meal_responses,
        total_calories=sum(m.calories for m in meals),
        total_protein=sum(m.protein for m in meals),
        total_carbs=sum(m.carbs for m in meals),
        total_fat=sum(m.fat for m in meals),
        meal_count=len(meals),
    )


@router.get("/meals/{meal_id}", response_model=MealResponse)
async def get_meal(
    meal_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific meal by ID."""
    result = await db.execute(
        select(Meal).where(
            and_(
                Meal.id == meal_id,
                Meal.user_id == current_user["user_id"],
            )
        )
    )
    meal = result.scalar_one_or_none()

    if not meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found",
        )

    return MealResponse.model_validate(meal)


@router.put("/meals/{meal_id}", response_model=MealResponse)
async def update_meal(
    meal_id: UUID,
    body: MealUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing meal."""
    result = await db.execute(
        select(Meal).where(
            and_(
                Meal.id == meal_id,
                Meal.user_id == current_user["user_id"],
            )
        )
    )
    meal = result.scalar_one_or_none()

    if not meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found",
        )

    update_data = body.model_dump(exclude_unset=True)
    if "meal_type" in update_data and update_data["meal_type"] is not None:
        update_data["meal_type"] = update_data["meal_type"].value

    for field, value in update_data.items():
        if value is not None:
            setattr(meal, field, value)

    await db.flush()
    await db.refresh(meal)
    return MealResponse.model_validate(meal)


@router.delete("/meals/{meal_id}", response_model=MessageResponse)
async def delete_meal(
    meal_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a meal."""
    result = await db.execute(
        select(Meal).where(
            and_(
                Meal.id == meal_id,
                Meal.user_id == current_user["user_id"],
            )
        )
    )
    meal = result.scalar_one_or_none()

    if not meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found",
        )

    await db.delete(meal)
    return MessageResponse(message="Meal deleted successfully")


@router.get("/health", response_model=MessageResponse)
async def health_check():
    """Health check endpoint."""
    return MessageResponse(message="Food service is healthy")
