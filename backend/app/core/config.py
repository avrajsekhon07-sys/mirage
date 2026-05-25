"""
Core configuration settings using Pydantic BaseSettings.
Loads from environment variables with sensible defaults.
"""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Mirage Detection Engine"
    DEBUG: bool = False
    API_V1_STR: str = "/api"

    # Security
    SECRET_KEY: str = "mirage-super-secret-key-change-in-production-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://mirage:mirage_pass@db:5432/mirage_db"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://frontend:3000",
    ]

    # ML Model settings
    ANOMALY_THRESHOLD: float = 0.75
    RISK_SCORE_WINDOW: int = 7  # days
    IMPULSIVE_BURST_THRESHOLD: int = 5  # transactions in 1 hour
    LATE_NIGHT_START_HOUR: int = 23
    LATE_NIGHT_END_HOUR: int = 5

    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30  # seconds

    # Transaction Simulator
    SIMULATOR_INTERVAL_SECONDS: float = 3.0
    SIMULATOR_USERS: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
