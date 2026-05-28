from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    APP_NAME: str = "Mirage"
    DEBUG: bool = False
    # REQUIRED in production — set via environment variable, never hardcode.
    # Generate: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = "SET_SECRET_KEY_ENV_VAR"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/mirage"
    ALLOWED_ORIGINS: List[str] = ["*"]
    WS_HEARTBEAT_INTERVAL: int = 30
    SIMULATOR_INTERVAL_SECONDS: float = 5.0

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
