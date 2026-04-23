import os
from functools import lru_cache


class Settings:
    """Application configuration loaded from environment variables."""

    APP_NAME: str = "Macro Calculation Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/macro_db"
    )

    # JWT (for validation only)
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production-please")
    JWT_ALGORITHM: str = "HS256"

    # Inter-service URLs
    FOOD_SERVICE_URL: str = os.getenv(
        "FOOD_SERVICE_URL", "http://food-service:8001"
    )
    AUTH_SERVICE_URL: str = os.getenv(
        "AUTH_SERVICE_URL", "http://auth-service:8000"
    )

    # Service
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8002"))


@lru_cache()
def get_settings() -> Settings:
    return Settings()
