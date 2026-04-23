import os
from functools import lru_cache


class Settings:
    """Application configuration loaded from environment variables."""

    APP_NAME: str = "Food Logging Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/food_db"
    )

    # JWT (for validation only — tokens are issued by auth-service)
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production-please")
    JWT_ALGORITHM: str = "HS256"

    # Service
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8001"))


@lru_cache()
def get_settings() -> Settings:
    return Settings()
