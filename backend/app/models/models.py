"""
SQLAlchemy ORM models for Mirage platform.
Tables: users, transactions, risk_scores, alerts, behavioral_profiles
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text, JSON, Enum as SAEnum
)
from sqlalchemy.orm import relationship
import enum

from app.db.database import Base


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertType(str, enum.Enum):
    IMPULSIVE_SPENDING = "impulsive_spending"
    SCAM_SUSCEPTIBILITY = "scam_susceptibility"
    EMOTIONAL_TRADING = "emotional_trading"
    GAMBLING_PATTERN = "gambling_pattern"
    TRANSACTION_BURST = "transaction_burst"
    LATE_NIGHT_ACTIVITY = "late_night_activity"
    ANOMALOUS_BEHAVIOR = "anomalous_behavior"
    BEHAVIORAL_DEVIATION = "behavioral_deviation"


class TransactionCategory(str, enum.Enum):
    GAMBLING = "gambling"
    CRYPTO = "crypto"
    RETAIL = "retail"
    FOOD = "food"
    ENTERTAINMENT = "entertainment"
    TRANSFER = "transfer"
    INVESTMENT = "investment"
    SUBSCRIPTION = "subscription"
    UNKNOWN = "unknown"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    risk_scores = relationship("RiskScore", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    behavioral_profile = relationship("BehavioralProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    merchant = Column(String(255))
    category = Column(SAEnum(TransactionCategory), default=TransactionCategory.UNKNOWN)
    description = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(Text)
    hour_of_day = Column(Integer)  # 0-23
    day_of_week = Column(Integer)  # 0=Monday, 6=Sunday
    metadata = Column(JSON, default={})

    # Relationships
    user = relationship("User", back_populates="transactions")


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    overall_score = Column(Float, nullable=False)  # 0.0 - 1.0
    behavioral_risk = Column(Float, default=0.0)
    manipulation_probability = Column(Float, default=0.0)
    impulsiveness_score = Column(Float, default=0.0)
    anomaly_score = Column(Float, default=0.0)
    scam_susceptibility = Column(Float, default=0.0)
    gambling_risk = Column(Float, default=0.0)
    risk_level = Column(SAEnum(RiskLevel), default=RiskLevel.LOW)
    shap_values = Column(JSON, default={})  # SHAP feature importances
    model_version = Column(String(50), default="1.0.0")
    computed_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="risk_scores")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    alert_type = Column(SAEnum(AlertType), nullable=False)
    severity = Column(SAEnum(RiskLevel), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    ai_explanation = Column(Text)  # Human-readable AI explanation
    is_read = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    transaction_ids = Column(JSON, default=[])  # Related transactions
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime)

    # Relationships
    user = relationship("User", back_populates="alerts")


class BehavioralProfile(Base):
    __tablename__ = "behavioral_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)

    # Spending patterns
    avg_transaction_amount = Column(Float, default=0.0)
    max_transaction_amount = Column(Float, default=0.0)
    total_transactions_7d = Column(Integer, default=0)
    total_transactions_30d = Column(Integer, default=0)

    # Temporal patterns
    peak_activity_hour = Column(Integer, default=12)
    late_night_transaction_ratio = Column(Float, default=0.0)
    weekend_activity_ratio = Column(Float, default=0.0)

    # Category distributions
    gambling_ratio = Column(Float, default=0.0)
    crypto_ratio = Column(Float, default=0.0)
    impulse_category_ratio = Column(Float, default=0.0)

    # Behavioral indicators
    transaction_velocity = Column(Float, default=0.0)  # tx per hour
    amount_variance = Column(Float, default=0.0)
    burst_frequency = Column(Integer, default=0)  # bursts in last 30d
    consecutive_escalation_count = Column(Integer, default=0)

    # Raw feature vectors for ML
    feature_vector = Column(JSON, default={})

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="behavioral_profile")
