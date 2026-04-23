import uuid
from datetime import datetime

from sqlalchemy import String, Float, DateTime, func, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Meal(Base):
    __tablename__ = "meals"
    __table_args__ = (
        Index("ix_meals_user_date", "user_id", "logged_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(
        String(200), nullable=False
    )
    meal_type: Mapped[str] = mapped_column(
        String(20), nullable=False  # breakfast, lunch, dinner, snack
    )
    calories: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )
    protein: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0  # grams
    )
    carbs: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0  # grams
    )
    fat: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0  # grams
    )
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Meal(id={self.id}, name={self.name}, user_id={self.user_id})>"
