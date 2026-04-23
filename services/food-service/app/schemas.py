from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class MealType(str, Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"


# ── Request Schemas ──────────────────────────────────────────────────────────

class MealCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    meal_type: MealType
    calories: float = Field(..., ge=0, le=10000)
    protein: float = Field(..., ge=0, le=1000)
    carbs: float = Field(..., ge=0, le=1000)
    fat: float = Field(..., ge=0, le=1000)
    logged_at: datetime | None = None


class MealUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    meal_type: MealType | None = None
    calories: float | None = Field(None, ge=0, le=10000)
    protein: float | None = Field(None, ge=0, le=1000)
    carbs: float | None = Field(None, ge=0, le=1000)
    fat: float | None = Field(None, ge=0, le=1000)
    logged_at: datetime | None = None


# ── Response Schemas ─────────────────────────────────────────────────────────

class MealResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    meal_type: str
    calories: float
    protein: float
    carbs: float
    fat: float
    logged_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MealListResponse(BaseModel):
    meals: list[MealResponse]
    total: int


class DailyMealsResponse(BaseModel):
    date: str
    meals: list[MealResponse]
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    meal_count: int


class MessageResponse(BaseModel):
    message: str
