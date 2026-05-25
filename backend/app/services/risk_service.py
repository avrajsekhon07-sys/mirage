"""Risk scoring service — orchestrates ML engine with database."""

from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.models import RiskScore, BehavioralProfile, User
from app.ml.risk_engine import get_risk_engine
from app.ml.explanation_engine import explanation_engine


class RiskService:

    @staticmethod
    async def get_latest_risk_score(db: AsyncSession, user_id: int) -> Optional[RiskScore]:
        result = await db.execute(
            select(RiskScore)
            .where(RiskScore.user_id == user_id)
            .order_by(desc(RiskScore.computed_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def compute_and_save_risk_score(db: AsyncSession, user_id: int) -> Optional[RiskScore]:
        """Run the ML pipeline and persist result."""
        # Get behavioral profile
        result = await db.execute(
            select(BehavioralProfile).where(BehavioralProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return None

        profile_dict = {
            "avg_transaction_amount": profile.avg_transaction_amount,
            "max_transaction_amount": profile.max_transaction_amount,
            "total_transactions_7d": profile.total_transactions_7d,
            "total_transactions_30d": profile.total_transactions_30d,
            "peak_activity_hour": profile.peak_activity_hour,
            "late_night_transaction_ratio": profile.late_night_transaction_ratio,
            "weekend_activity_ratio": profile.weekend_activity_ratio,
            "gambling_ratio": profile.gambling_ratio,
            "crypto_ratio": profile.crypto_ratio,
            "transaction_velocity": profile.transaction_velocity,
            "amount_variance": profile.amount_variance,
            "burst_frequency": profile.burst_frequency,
            "consecutive_escalation_count": profile.consecutive_escalation_count,
            "feature_vector": profile.feature_vector or {},
        }

        engine = get_risk_engine()
        scores = engine.compute_risk_scores(profile_dict)

        risk_score = RiskScore(user_id=user_id, **scores)
        db.add(risk_score)
        await db.flush()
        return risk_score

    @staticmethod
    async def get_dashboard_ai_summary(
        db: AsyncSession,
        user_id: int,
        alert_count: int,
    ) -> str:
        latest = await RiskService.get_latest_risk_score(db, user_id)
        profile_result = await db.execute(
            select(BehavioralProfile).where(BehavioralProfile.user_id == user_id)
        )
        profile = profile_result.scalar_one_or_none()

        if not latest or not profile:
            return "Insufficient data for AI analysis. Submit transactions to begin profiling."

        risk_dict = {
            "overall_score": latest.overall_score,
            "risk_level": latest.risk_level.value,
            "manipulation_probability": latest.manipulation_probability,
            "anomaly_score": latest.anomaly_score,
            "impulsiveness_score": latest.impulsiveness_score,
            "gambling_risk": latest.gambling_risk,
        }
        profile_dict = {
            "late_night_transaction_ratio": profile.late_night_transaction_ratio,
            "gambling_ratio": profile.gambling_ratio,
        }

        return explanation_engine.generate_dashboard_summary(risk_dict, profile_dict, alert_count)
