from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


# ── Response Schemas ─────────────────────────────────────────────────────────

class AlertResponse(BaseModel):
    id: UUID
    user_id: UUID
    alert_type: str
    severity: str
    title: str
    message: str
    date: date
    is_read: bool
    metadata_json: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertListResponse(BaseModel):
    alerts: list[AlertResponse]
    total: int
    unread_count: int


class ComplianceCheckResponse(BaseModel):
    id: UUID
    user_id: UUID
    date: date
    protein_status: str
    calorie_status: str
    carbs_status: str
    fat_status: str
    overall_compliant: bool
    details: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PatternAnalysisResponse(BaseModel):
    analyzed_days: int
    patterns_found: list[dict]
    alerts_generated: int
    message: str


class MessageResponse(BaseModel):
    message: str
