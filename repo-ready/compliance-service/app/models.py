import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, String, Date, DateTime, Integer, JSON, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    alert_type: Mapped[str] = mapped_column(
        String(50), nullable=False
        # protein_deficiency, calorie_surplus, calorie_deficit, pattern_detected
    )
    severity: Mapped[str] = mapped_column(
        String(20), nullable=False  # info, warning, critical
    )
    title: Mapped[str] = mapped_column(
        String(200), nullable=False
    )
    message: Mapped[str] = mapped_column(
        String(1000), nullable=False
    )
    date: Mapped[date] = mapped_column(
        Date, nullable=False
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    metadata_json: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, default=None
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Alert(id={self.id}, type={self.alert_type}, severity={self.severity})>"


class ComplianceCheck(Base):
    __tablename__ = "compliance_checks"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_compliance_user_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    date: Mapped[date] = mapped_column(
        Date, nullable=False
    )
    protein_status: Mapped[str] = mapped_column(
        String(20), nullable=False  # ok, deficient, excess
    )
    calorie_status: Mapped[str] = mapped_column(
        String(20), nullable=False  # ok, surplus, deficit
    )
    carbs_status: Mapped[str] = mapped_column(
        String(20), nullable=False
    )
    fat_status: Mapped[str] = mapped_column(
        String(20), nullable=False
    )
    overall_compliant: Mapped[bool] = mapped_column(
        Boolean, nullable=False
    )
    details: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, default=None
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<ComplianceCheck(user_id={self.user_id}, date={self.date}, compliant={self.overall_compliant})>"
