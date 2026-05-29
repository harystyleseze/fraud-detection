"""
config.py — Read all environment variables.

Every call to get_settings() after the first returns the same
cached object
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # Application level settings
    APP_ENV:     str = "development"
    APP_NAME:    str = "Fraud Detection API"
    APP_VERSION: str = "1.0.0"

    # Database 
    # Default for local dev env: SQLite
    # Override in .env for Docker or production PostgreSQL
    DATABASE_URL: str = "sqlite:///./fraud.db"

    # CORS 
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Fraud detection thresholds
    RAPID_TXN_COUNT:              int   = 5
    RAPID_TXN_WINDOW_SECONDS:     int   = 60
    DAILY_LIMIT_USD:              float = 10000.00
    LOCATION_JUMP_WINDOW_SECONDS: int   = 120

    # Properties 
    @property
    def cors_origins_list(self) -> list[str]:
        """Returns CORS_ORIGINS as a Python list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


@lru_cache()
def get_settings() -> Settings:
    """
    Returns a cached Settings instance.

    Dependency Use:
        settings = Depends(get_settings)
    """
    return Settings()