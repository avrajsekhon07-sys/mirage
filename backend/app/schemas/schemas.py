"""
Pydantic schemas for request/response validation.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field, validator

from app.models.models import AlertType, RiskLevel, TransactionCategory


# ─── Auth Schemas ────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Transaction Schemas ──────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    amount: float = Field(..., gt=0)
    merchant: Optional[str] = None
    category: TransactionCategory = TransactionCategory.UNKNOWN
    description: Optional[str] = None
    timestamp: Optional[datetime] = None


class TransactionOut(BaseModel):
    id: int
    user_id: int
    amount: float
    merchant: Optional[str]
    category: TransactionCategory
    description: Optional[str]
    timestamp: datetime
    is_flagged: bool
    flag_reason: Optional[str]
    hour_of_day: Optional[int]
    day_of_week: Optional[int]

    class Config:
        from_attributes = True


class TransactionPage(BaseModel):
    items: List[TransactionOut]
    total: int
    page: int
    page_size: int


# ─── Risk Score Schemas ───────────────────────────────────────────────────────

class RiskScoreOut(BaseModel):
    id: int
    user_id: int
    overall_score: float
    behavioral_risk: float
    manipulation_probability: float
    impulsiveness_score: float
    anomaly_score: float
    scam_susceptibility: float
    gambling_risk: float
    risk_level: RiskLevel
    shap_values: Dict[str, Any]
    computed_at: datetime

    class Config:
        from_attributes = True


# ─── Alert Schemas ────────────────────────────────────────────────────────────

class AlertOut(BaseModel):
    id: int
    user_id: int
    alert_type: AlertType
    severity: RiskLevel
    title: str
    message: str
    ai_explanation: Optional[str]
    is_read: bool
    is_resolved: bool
    transaction_ids: List[int]
    created_at: datetime

    class Config:
        from_attributes = True


class AlertUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_resolved: Optional[bool] = None


# ─── Analytics Schemas ────────────────────────────────────────────────────────

class BehavioralProfileOut(BaseModel):
    user_id: int
    avg_transaction_amount: float
    max_transaction_amount: float
    total_transactions_7d: int
    total_transactions_30d: int
    peak_activity_hour: int
    late_night_transaction_ratio: float
    weekend_activity_ratio: float
    gambling_ratio: float
    crypto_ratio: float
    transaction_velocity: float
    amount_variance: float
    burst_frequency: int
    consecutive_escalation_count: int
    updated_at: datetime

    class Config:
        from_attributes = True


class TrendPoint(BaseModel):
    timestamp: str
    value: float
    label: Optional[str] = None


class RiskTrendResponse(BaseModel):
    risk_trend: List[TrendPoint]
    anomaly_trend: List[TrendPoint]
    impulsiveness_trend: List[TrendPoint]


class HeatmapCell(BaseModel):
    hour: int
    day: int
    value: float
    count: int


class HourlyActivityResponse(BaseModel):
    heatmap: List[HeatmapCell]
    peak_hours: List[int]
    suspicious_hours: List[int]


class DashboardSummary(BaseModel):
    user: UserOut
    latest_risk_score: Optional[RiskScoreOut]
    behavioral_profile: Optional[BehavioralProfileOut]
    unread_alerts_count: int
    recent_alerts: List[AlertOut]
    recent_transactions: List[TransactionOut]
    ai_summary: str


class AdminStats(BaseModel):
    total_users: int
    active_users_24h: int
    total_transactions_24h: int
    critical_risk_users: int
    high_risk_users: int
    total_alerts_24h: int
    avg_risk_score: float
    top_risk_users: List[Dict[str, Any]]


# ─── WebSocket Event Schemas ──────────────────────────────────────────────────

class WSEvent(BaseModel):
    event_type: str  # transaction | risk_update | alert | heartbeat
    user_id: Optional[int] = None
    data: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Update forward references
TokenResponse.model_rebuild()
