"""Transaction routes: create, list, stats."""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.db.database import get_db
from app.models.models import Transaction, TransactionCategory
from app.schemas.schemas import TransactionCreate, TransactionOut, TransactionPage
from app.core.security import get_current_user

router = APIRouter()


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
