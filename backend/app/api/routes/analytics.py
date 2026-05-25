"""Analytics routes: risk scores, trends, heatmaps, dashboard."""

from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.db.database import get_db
from app.models.models import (
    RiskScore, Transaction, BehavioralProfile, Alert
)
from app.schemas.schemas import (
    RiskScoreOut, RiskTrendResponse, TrendPoint,
    HourlyActivityResponse, HeatmapCell, DashboardSummary,
    BehavioralProfileOut, AlertOut, TransactionOut, UserOut
)
from app.core.security import get_current_user
from app.services.risk_service import RiskService
from app.ml.explanation_engine import explanation_engine

router = APIRouter()


@router.get("/dashboard", response_model=DashboardSummary)
async def get_dashboard(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Full dashboard summary for the current user."""
    # Latest risk score
    latest_risk = await RiskService.get_latest_risk_score(db, current_user.id)

    # Behavioral profile
    profile_result = await db.execute(
        select(BehavioralProfile).where(BehavioralProfile.user_id == current_user.id)
    )
    profile = profile_result.scalar_one_or_none()

    # Unread alerts count
    count_result = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.user_id == current_user.id,
            Alert.is_read == False,
        )
    )
    unread_count = count_result.scalar() or 0

    # Recent alerts
    alerts_result = await db.execute(
        select(Alert)
        .where(Alert.user_id == current_user.id)
        .order_by(desc(Alert.created_at))
        .limit(5)
    )
    recent_alerts = alerts_result.scalars().all()

    # Recent transactions
    txs_result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == current_user.id)
        .order_by(desc(Transaction.timestamp))
        .limit(10)
    )
    recent_txs = txs_result.scalars().all()

    # AI summary
    ai_summary = await RiskService.get_dashboard_ai_summary(db, current_user.id, unread_count)

    return DashboardSummary(
        user=UserOut.model_validate(current_user),
        latest_risk_score=RiskScoreOut.model_validate(latest_risk) if latest_risk else None,
        behavioral_profile=BehavioralProfileOut.model_validate(profile) if profile else None,
        unread_alerts_count=unread_count,
        recent_alerts=[AlertOut.model_validate(a) for a in recent_alerts],
        recent_transactions=[TransactionOut.model_validate(t) for t in recent_txs],
        ai_summary=ai_summary,
    )


@router.get("/risk-score", response_model=RiskScoreOut)
async def get_current_risk_score(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get or compute latest risk score."""
    score = await RiskService.get_latest_risk_score(db, current_user.id)
    if not score:
        score = await RiskService.compute_and_save_risk_score(db, current_user.id)
        await db.commit()
    return score


@router.post("/risk-score/refresh", response_model=RiskScoreOut)
async def refresh_risk_score(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Force-recompute risk score from latest behavioral data."""
    score = await RiskService.compute_and_save_risk_score(db, current_user.id)
    await db.commit()

    # Emit WebSocket update
    from app.services.websocket_manager import manager
    if score:
        await manager.emit_risk_update(
            {"overall_score": score.overall_score, "risk_level": score.risk_level.value},
            current_user.id,
        )
    return score


@router.get("/risk-trend", response_model=RiskTrendResponse)
async def get_risk_trend(
    days: int = Query(7, ge=1, le=30),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get risk score trends over time."""
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(RiskScore)
        .where(RiskScore.user_id == current_user.id, RiskScore.computed_at >= since)
        .order_by(RiskScore.computed_at)
    )
    scores = result.scalars().all()

    risk_trend = [TrendPoint(timestamp=s.computed_at.isoformat(), value=round(s.overall_score * 100, 1)) for s in scores]
    anomaly_trend = [TrendPoint(timestamp=s.computed_at.isoformat(), value=round(s.anomaly_score * 100, 1)) for s in scores]
    impulsiveness_trend = [TrendPoint(timestamp=s.computed_at.isoformat(), value=round(s.impulsiveness_score * 100, 1)) for s in scores]

    return RiskTrendResponse(
        risk_trend=risk_trend,
        anomaly_trend=anomaly_trend,
        impulsiveness_trend=impulsiveness_trend,
    )


@router.get("/heatmap", response_model=HourlyActivityResponse)
async def get_activity_heatmap(
    days: int = Query(30, ge=7, le=90),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get transaction activity heatmap by hour/day."""
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(Transaction).where(
            Transaction.user_id == current_user.id,
            Transaction.timestamp >= since,
            Transaction.hour_of_day.isnot(None),
            Transaction.day_of_week.isnot(None),
        )
    )
    txs = result.scalars().all()

    # Build heatmap grid
    grid: dict = {}
    for tx in txs:
        key = (tx.hour_of_day, tx.day_of_week)
        if key not in grid:
            grid[key] = {"total_amount": 0, "count": 0}
        grid[key]["total_amount"] += tx.amount
        grid[key]["count"] += 1

    heatmap = []
    max_count = max((v["count"] for v in grid.values()), default=1)
    for (hour, day), data in grid.items():
        heatmap.append(HeatmapCell(
            hour=hour, day=day,
            value=round(data["count"] / max_count, 3),
            count=data["count"],
        ))

    # Identify suspicious hours (23-5)
    suspicious = list(range(23, 24)) + list(range(0, 6))

    # Peak hours from data
    hour_counts: dict = {}
    for tx in txs:
        hour_counts[tx.hour_of_day] = hour_counts.get(tx.hour_of_day, 0) + 1
    peak_hours = sorted(hour_counts, key=lambda h: hour_counts[h], reverse=True)[:3]

    return HourlyActivityResponse(
        heatmap=heatmap,
        peak_hours=peak_hours,
        suspicious_hours=suspicious,
    )


@router.get("/behavioral-profile", response_model=BehavioralProfileOut)
async def get_behavioral_profile(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get behavioral profile for current user."""
    result = await db.execute(
        select(BehavioralProfile).where(BehavioralProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.get("/shap-explanation")
async def get_shap_explanation(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get SHAP feature contribution explanations."""
    latest_risk = await RiskService.get_latest_risk_score(db, current_user.id)
    if not latest_risk or not latest_risk.shap_values:
        return {"contributions": []}

    contributions = explanation_engine.generate_shap_explanation(latest_risk.shap_values)
    return {"contributions": contributions}
