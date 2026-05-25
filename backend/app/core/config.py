from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Mirage Detection Engine"
    DEBUG: bool = False
    SECRET_KEY: str = "mirage-super-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/mirage"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    ANOMALY_THRESHOLD: float = 0.75
    RISK_SCORE_WINDOW: int = 7
    IMPULSIVE_BURST_THRESHOLD: int = 5
    LATE_NIGHT_START_HOUR: int = 23
    LATE_NIGHT_END_HOUR: int = 5
    WS_HEARTBEAT_INTERVAL: int = 30
    SIMULATOR_INTERVAL_SECONDS: float = 5.0
    SIMULATOR_USERS: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
