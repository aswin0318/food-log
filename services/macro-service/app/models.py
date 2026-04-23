import uuid
from datetime import date, datetime

from sqlalchemy import Integer, Float, Date, DateTime, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MacroTarget(Base):
    __tablename__ = "macro_targets"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_macro_targets_user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    daily_calorie_target: Mapped[int] = mapped_column(
        Integer, default=2000, nullable=False
    )
    daily_protein_target: Mapped[int] = mapped_column(
        Integer, default=150, nullable=False
    )
    daily_carbs_target: Mapped[int] = mapped_column(
        Integer, default=250, nullable=False
    )
    daily_fat_target: Mapped[int] = mapped_column(
        Integer, default=65, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<MacroTarget(user_id={self.user_id})>"


class DailySummaryCache(Base):
    __tablename__ = "daily_summary_cache"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_daily_summary_user_date"),
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
    total_calories: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )
    total_protein: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )
    total_carbs: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )
    total_fat: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )
    meal_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<DailySummaryCache(user_id={self.user_id}, date={self.date})>"
