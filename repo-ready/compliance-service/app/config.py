import os
from functools import lru_cache


class Settings:
    """Application configuration loaded from environment variables."""

    APP_NAME: str = "Compliance & Alert Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/compliance_db"
    )

    # JWT (for validation only)
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production-please")
    JWT_ALGORITHM: str = "HS256"

    # Inter-service URLs
    MACRO_SERVICE_URL: str = os.getenv(
        "MACRO_SERVICE_URL", "http://macro-service:8002"
    )

    # Compliance thresholds
    PROTEIN_DEFICIENCY_PCT: float = float(os.getenv("PROTEIN_DEFICIENCY_PCT", "80"))
    CALORIE_SURPLUS_PCT: float = float(os.getenv("CALORIE_SURPLUS_PCT", "120"))
    CALORIE_DEFICIT_PCT: float = float(os.getenv("CALORIE_DEFICIT_PCT", "70"))
    PATTERN_DAYS: int = int(os.getenv("PATTERN_DAYS", "3"))

    # Service
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8003"))


@lru_cache()
def get_settings() -> Settings:
    return Settings()
