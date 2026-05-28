"""Transaction routes: create, list, stats, simulate, attack-sim."""

import random
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.db.database import get_db
from app.models.models import Transaction, TransactionCategory, Alert, AlertType, RiskLevel
from app.schemas.schemas import TransactionCreate, TransactionOut, TransactionPage, RiskScoreOut
from app.core.security import get_current_user

router = APIRouter()

# Suspicious transactions used by the attack simulation
_ATTACK_SEQUENCE = [
    {"amount": 3200,  "merchant": "BetWay Online",      "category": TransactionCategory.GAMBLING, "desc": "Casino deposit",                    "hour": 23},
    {"amount": 5500,  "merchant": "Bet365",              "category": TransactionCategory.GAMBLING, "desc": "Sports betting — escalating",       "hour": 0},
    {"amount": 8500,  "merchant": "Binance",             "category": TransactionCategory.CRYPTO,   "desc": "Emergency crypto transfer",         "hour": 2},
    {"amount": 2800,  "merchant": "PokerStars",          "category": TransactionCategory.GAMBLING, "desc": "Poker tournament burst",            "hour": 1},
    {"amount": 12000, "merchant": "Unverified Wire",     "category": TransactionCategory.TRANSFER, "desc": "International wire — unknown payee","hour": 3},
    {"amount": 1900,  "merchant": "KuCoin",              "category": TransactionCategory.CRYPTO,   "desc": "Alt-coin accumulation",             "hour": 23},
    {"amount": 7500,  "merchant": "Anonymous Transfer",  "category": TransactionCategory.UNKNOWN,  "desc": "Unknown vendor — flagged",          "hour": 4},
    {"amount": 15000, "merchant": "CashApp P2P",         "category": TransactionCategory.TRANSFER, "desc": "Large P2P — possible coercion",     "hour": 2},
]


def _flag_transaction(amount: float, hour: int, category: TransactionCategory):
    if amount > 5000:
        return True, "Unusually large transaction amount"
    if hour in (23, 0, 1, 2, 3, 4) and amount > 500:
        return True, "Large late-night transaction"
    if category in (TransactionCategory.GAMBLING, TransactionCategory.UNKNOWN) and amount > 200:
        return True, f"High-risk category: {category.value}"
    return False, None


@router.post("/", response_model=TransactionOut, status_code=201)
async def create_transaction(
    data: TransactionCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new transaction (manual entry)."""
    timestamp = data.timestamp or datetime.utcnow()
    tx = Transaction(
        user_id=current_user.id,
        amount=data.amount,
        merchant=data.merchant,
        category=data.category,
        description=data.description,
        timestamp=timestamp,
        hour_of_day=timestamp.hour,
        day_of_week=timestamp.weekday(),
    )
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    return tx


@router.get("/", response_model=TransactionPage)
async def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[TransactionCategory] = None,
    flagged_only: bool = False,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List transactions with pagination and filters."""
    query = select(Transaction).where(Transaction.user_id == current_user.id)

    if category:
        query = query.where(Transaction.category == category)
    if flagged_only:
        query = query.where(Transaction.is_flagged == True)

    # Count
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    # Paginate
    query = query.order_by(desc(Transaction.timestamp)).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return TransactionPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/recent", response_model=List[TransactionOut])
async def get_recent_transactions(
    limit: int = Query(10, ge=1, le=50),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get most recent transactions."""
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == current_user.id)
        .order_by(desc(Transaction.timestamp))
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/flagged", response_model=List[TransactionOut])
async def get_flagged_transactions(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all flagged transactions for the current user."""
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == current_user.id, Transaction.is_flagged == True)
        .order_by(desc(Transaction.timestamp))
        .limit(50)
    )
    return result.scalars().all()


@router.get("/{transaction_id}", response_model=TransactionOut)
async def get_transaction(
    transaction_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific transaction by ID."""
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id,
        )
    )
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@router.post("/simulate")
async def simulate_transaction(
    data: TransactionCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a transaction, recompute risk, and return the scored result."""
    from app.services.risk_service import RiskService, recompute_behavioral_profile
    from app.services.websocket_manager import manager

    # Snapshot previous risk
    prev = await RiskService.get_latest_risk_score(db, current_user.id)
    prev_pct = round((prev.overall_score if prev else 0.0) * 100, 1)

    timestamp = data.timestamp or datetime.utcnow()
    hour = timestamp.hour
    is_flagged, flag_reason = _flag_transaction(data.amount, hour, data.category)

    tx = Transaction(
        user_id=current_user.id,
        amount=data.amount,
        merchant=data.merchant,
        category=data.category,
        description=data.description or f"{data.merchant or data.category.value} payment",
        timestamp=timestamp,
        is_flagged=is_flagged,
        flag_reason=flag_reason,
        hour_of_day=hour,
        day_of_week=timestamp.weekday(),
    )
    db.add(tx)
    await db.flush()

    await recompute_behavioral_profile(db, current_user.id)
    new_score = await RiskService.compute_and_save_risk_score(db, current_user.id)
    await db.commit()

    new_pct = round((new_score.overall_score if new_score else 0.0) * 100, 1)

    await manager.emit_transaction(
        {"id": tx.id, "amount": tx.amount, "merchant": tx.merchant,
         "category": tx.category.value, "timestamp": tx.timestamp.isoformat(),
         "is_flagged": tx.is_flagged},
        current_user.id,
    )
    if new_score:
        await manager.emit_risk_update(
            {"overall_score": new_score.overall_score, "risk_level": new_score.risk_level.value},
            current_user.id,
        )

    return {
        "transaction": TransactionOut.model_validate(tx),
        "risk_score": RiskScoreOut.model_validate(new_score) if new_score else None,
        "prev_risk": prev_pct,
        "new_risk": new_pct,
        "risk_delta": round(new_pct - prev_pct, 1),
        "flagged": is_flagged,
        "flag_reason": flag_reason,
        "risk_level": new_score.risk_level.value if new_score else "unknown",
    }


@router.post("/attack-sim")
async def attack_simulation(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Run a scripted attack sequence to demonstrate live detection."""
    from app.services.risk_service import RiskService, recompute_behavioral_profile
    from app.services.websocket_manager import manager
    from app.ml.explanation_engine import explanation_engine

    prev = await RiskService.get_latest_risk_score(db, current_user.id)
    prev_pct = round((prev.overall_score if prev else 0.0) * 100, 1)

    now = datetime.utcnow()
    results = []

    for i, item in enumerate(_ATTACK_SEQUENCE):
        ts = (now - timedelta(minutes=len(_ATTACK_SEQUENCE) - i)).replace(
            hour=item["hour"], minute=random.randint(0, 59)
        )
        tx = Transaction(
            user_id=current_user.id,
            amount=item["amount"],
            merchant=item["merchant"],
            category=item["category"],
            description=item["desc"],
            timestamp=ts,
            is_flagged=True,
            flag_reason=f"Attack simulation — {item['category'].value}",
            hour_of_day=item["hour"],
            day_of_week=ts.weekday(),
        )
        db.add(tx)
        await db.flush()
        await manager.emit_transaction(
            {"id": tx.id, "amount": tx.amount, "merchant": tx.merchant,
             "category": tx.category.value, "timestamp": tx.timestamp.isoformat(),
             "is_flagged": True},
            current_user.id,
        )
        results.append({
            "merchant": tx.merchant,
            "amount": tx.amount,
            "category": tx.category.value,
        })

    await recompute_behavioral_profile(db, current_user.id)
    new_score = await RiskService.compute_and_save_risk_score(db, current_user.id)

    # Force critical alert
    from app.services.transaction_simulator import TransactionSimulator
    sim = TransactionSimulator()
    if new_score:
        profile_result = await db.execute(
            select(Transaction).where(Transaction.user_id == current_user.id)
        )
        profile_dict: dict = {}
        try:
            from app.models.models import BehavioralProfile
            bp = (await db.execute(
                select(BehavioralProfile).where(BehavioralProfile.user_id == current_user.id)
            )).scalar_one_or_none()
            if bp:
                profile_dict = {
                    "gambling_ratio": bp.gambling_ratio,
                    "late_night_transaction_ratio": bp.late_night_transaction_ratio,
                }
        except Exception:
            pass

        scores_dict = {
            "overall_score": new_score.overall_score,
            "behavioral_risk": new_score.behavioral_risk,
            "manipulation_probability": new_score.manipulation_probability,
            "impulsiveness_score": new_score.impulsiveness_score,
            "anomaly_score": new_score.anomaly_score,
            "scam_susceptibility": new_score.scam_susceptibility,
            "gambling_risk": new_score.gambling_risk,
        }
        await sim._maybe_create_alerts(db, current_user.id, scores_dict, profile_dict)
        await manager.emit_risk_update(
            {"overall_score": new_score.overall_score, "risk_level": new_score.risk_level.value},
            current_user.id,
        )

    await db.commit()

    new_pct = round((new_score.overall_score if new_score else 0.0) * 100, 1)
    return {
        "transactions": results,
        "prev_risk": prev_pct,
        "new_risk": new_pct,
        "risk_delta": round(new_pct - prev_pct, 1),
        "risk_level": new_score.risk_level.value if new_score else "critical",
        "tx_count": len(results),
    }
