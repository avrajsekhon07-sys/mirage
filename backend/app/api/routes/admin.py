"""Admin routes — platform-wide statistics and oversight."""

from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.db.database import get_db
from app.models.models import User, Transaction, Alert, RiskScore, RiskLevel
from app.schemas.schemas import AdminStats
from app.core.security import get_current_admin

router = APIRouter()


@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    _=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Platform-wide statistics for admin dashboard."""
    now = datetime.utcnow()
    day_ago = now - timedelta(hours=24)

    # Totals
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    active_24h = (await db.execute(
        select(func.count(func.distinct(Transaction.user_id)))
        .where(Transaction.timestamp >= day_ago)
    )).scalar() or 0

    total_tx_24h = (await db.execute(
        select(func.count(Transaction.id)).where(Transaction.timestamp >= day_ago)
    )).scalar() or 0

    alerts_24h = (await db.execute(
        select(func.count(Alert.id)).where(Alert.created_at >= day_ago)
    )).scalar() or 0

    # Risk distribution
    critical_users = (await db.execute(
        select(func.count(func.distinct(RiskScore.user_id)))
        .where(RiskScore.risk_level == RiskLevel.CRITICAL)
    )).scalar() or 0

    high_users = (await db.execute(
        select(func.count(func.distinct(RiskScore.user_id)))
        .where(RiskScore.risk_level == RiskLevel.HIGH)
    )).scalar() or 0

    avg_risk = (await db.execute(
        select(func.avg(RiskScore.overall_score))
    )).scalar() or 0.0

    # Top risk users (latest score per user)
    top_risk_result = await db.execute(
        select(User.id, User.username, User.email, RiskScore.overall_score, RiskScore.risk_level)
        .join(RiskScore, RiskScore.user_id == User.id)
        .order_by(desc(RiskScore.overall_score))
        .limit(5)
    )
    top_risk_users = [
        {
            "user_id": row[0],
            "username": row[1],
            "email": row[2],
            "overall_score": round(row[3], 4),
            "risk_level": row[4].value if row[4] else "low",
        }
        for row in top_risk_result.all()
    ]

    return AdminStats(
        total_users=total_users,
        active_users_24h=active_24h,
        total_transactions_24h=total_tx_24h,
        critical_risk_users=critical_users,
        high_risk_users=high_users,
        total_alerts_24h=alerts_24h,
        avg_risk_score=round(float(avg_risk), 4),
        top_risk_users=top_risk_users,
    )


@router.get("/users")
async def list_all_users(
    _=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with their latest risk scores."""
    result = await db.execute(
        select(User).where(User.is_active == True).order_by(User.created_at)
    )
    users = result.scalars().all()

    user_data = []
    for user in users:
        latest_risk = await db.execute(
            select(RiskScore)
            .where(RiskScore.user_id == user.id)
            .order_by(desc(RiskScore.computed_at))
            .limit(1)
        )
        risk = latest_risk.scalar_one_or_none()
        user_data.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "created_at": user.created_at.isoformat(),
            "overall_score": risk.overall_score if risk else 0,
            "risk_level": risk.risk_level.value if risk else "low",
        })

    return user_data
