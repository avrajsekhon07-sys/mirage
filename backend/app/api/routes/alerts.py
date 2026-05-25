"""Alerts routes."""

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, update

from app.db.database import get_db
from app.models.models import Alert
from app.schemas.schemas import AlertOut, AlertUpdate
from app.core.security import get_current_user

router = APIRouter()


@router.get("/", response_model=List[AlertOut])
async def list_alerts(
    unread_only: bool = False,
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List alerts for current user."""
    query = select(Alert).where(Alert.user_id == current_user.id)
    if unread_only:
        query = query.where(Alert.is_read == False)
    query = query.order_by(desc(Alert.created_at)).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/{alert_id}", response_model=AlertOut)
async def update_alert(
    alert_id: int,
    data: AlertUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark alert as read or resolved."""
    from fastapi import HTTPException
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == current_user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if data.is_read is not None:
        alert.is_read = data.is_read
    if data.is_resolved is not None:
        alert.is_resolved = data.is_resolved

    await db.commit()
    await db.refresh(alert)
    return alert


@router.post("/mark-all-read")
async def mark_all_read(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all alerts as read."""
    await db.execute(
        update(Alert)
        .where(Alert.user_id == current_user.id, Alert.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
    return {"message": "All alerts marked as read"}
