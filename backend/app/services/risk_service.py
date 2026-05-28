"""Risk scoring service — orchestrates ML engine with database."""

import statistics
from datetime import datetime, timedelta
from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.models import RiskScore, BehavioralProfile, Transaction, TransactionCategory, User
from app.ml.risk_engine import get_risk_engine
from app.ml.explanation_engine import explanation_engine


async def recompute_behavioral_profile(db: AsyncSession, user_id: int) -> BehavioralProfile:
    """Recompute all behavioral profile fields from the last 30 days of transactions."""
    week_ago = datetime.utcnow() - timedelta(days=7)
    month_ago = datetime.utcnow() - timedelta(days=30)

    week_txs = (await db.execute(
        select(Transaction).where(Transaction.user_id == user_id, Transaction.timestamp >= week_ago)
    )).scalars().all()

    month_txs = (await db.execute(
        select(Transaction).where(Transaction.user_id == user_id, Transaction.timestamp >= month_ago)
    )).scalars().all()

    result = await db.execute(select(BehavioralProfile).where(BehavioralProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = BehavioralProfile(user_id=user_id)
        db.add(profile)

    if not month_txs:
        return profile

    amounts = [t.amount for t in month_txs]
    n = len(month_txs)
    avg_amt = sum(amounts) / n

    late_night = sum(1 for t in month_txs if t.hour_of_day is not None and (t.hour_of_day >= 23 or t.hour_of_day <= 5))
    weekend    = sum(1 for t in month_txs if t.day_of_week  is not None and t.day_of_week >= 5)
    gambling   = sum(1 for t in month_txs if t.category == TransactionCategory.GAMBLING)
    crypto     = sum(1 for t in month_txs if t.category == TransactionCategory.CRYPTO)
    high_value = sum(1 for a in amounts   if a > avg_amt * 2)
    cat_count  = len(set(t.category for t in month_txs))

    hour_freq: dict = {}
    for t in month_txs:
        if t.hour_of_day is not None:
            hour_freq[t.hour_of_day] = hour_freq.get(t.hour_of_day, 0) + 1
    peak = max(hour_freq, key=hour_freq.get) if hour_freq else 12

    sorted_txs = sorted(month_txs, key=lambda t: t.timestamp)
    bursts = sum(
        1 for i in range(1, len(sorted_txs))
        if (sorted_txs[i].timestamp - sorted_txs[i-1].timestamp).total_seconds() < 3600
    )
    esc = cur = 0
    for i in range(1, len(sorted_txs)):
        cur = (cur + 1) if sorted_txs[i].amount > sorted_txs[i-1].amount * 1.5 else 0
        esc = max(esc, cur)

    profile.avg_transaction_amount        = round(avg_amt, 2)
    profile.max_transaction_amount        = round(max(amounts), 2)
    profile.total_transactions_7d         = len(week_txs)
    profile.total_transactions_30d        = n
    profile.peak_activity_hour            = peak
    profile.late_night_transaction_ratio  = round(late_night / n, 4)
    profile.weekend_activity_ratio        = round(weekend    / n, 4)
    profile.gambling_ratio                = round(gambling   / n, 4)
    profile.crypto_ratio                  = round(crypto     / n, 4)
    profile.transaction_velocity          = round(n / 30.0,  4)
    profile.amount_variance               = round(statistics.variance(amounts) if len(amounts) > 1 else 0.0, 2)
    profile.burst_frequency               = min(bursts, 20)
    profile.consecutive_escalation_count  = esc
    profile.feature_vector                = {"high_value_ratio": round(high_value / n, 4), "category_diversity": cat_count}

    return profile


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
