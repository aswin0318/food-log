from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


# ── Request Schemas ──────────────────────────────────────────────────────────

class UpdateTargetsRequest(BaseModel):
    daily_calorie_target: int = Field(..., ge=500, le=10000)
    daily_protein_target: int = Field(..., ge=10, le=500)
    daily_carbs_target: int = Field(..., ge=10, le=1000)
    daily_fat_target: int = Field(..., ge=10, le=500)


# ── Response Schemas ─────────────────────────────────────────────────────────

class MacroTargetResponse(BaseModel):
    user_id: UUID
    daily_calorie_target: int
    daily_protein_target: int
    daily_carbs_target: int
    daily_fat_target: int
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class DailySummaryResponse(BaseModel):
    date: str
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    meal_count: int


class DailyComparisonResponse(BaseModel):
    date: str
    actual: DailySummaryResponse
    target: MacroTargetResponse
    calorie_percentage: float
    protein_percentage: float
    carbs_percentage: float
    fat_percentage: float
    calorie_status: str  # ok, surplus, deficit
    protein_status: str  # ok, deficient, excess
    carbs_status: str
    fat_status: str


class WeeklySummaryResponse(BaseModel):
    start_date: str
    end_date: str
    daily_breakdowns: list[DailySummaryResponse]
    weekly_averages: DailySummaryResponse
    total_meals: int


class MessageResponse(BaseModel):
    message: str
