"""WebSocket route for real-time event streaming."""

import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError

from app.services.websocket_manager import manager
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/stream")
async def websocket_stream(
    websocket: WebSocket,
    token: str = Query(...),
    user_id: int = Query(...),
):
    """
    WebSocket endpoint for real-time transaction and risk event streaming.
    Requires JWT token query param for auth.
    """
    from app.core.security import decode_token

    # Validate token
    try:
        payload = decode_token(token)
        token_user_id = int(payload.get("sub", 0))
        is_admin = payload.get("is_admin", False)

        # Users can only subscribe to their own stream (admins can subscribe to any)
        if not is_admin and token_user_id != user_id:
            await websocket.close(code=4003, reason="Unauthorized")
            return

    except Exception as e:
        logger.warning(f"WebSocket auth failed: {e}")
        await websocket.close(code=4001, reason="Authentication failed")
        return

    # Connect
    await manager.connect(websocket, user_id=user_id, is_admin=is_admin)
    logger.info(f"WebSocket connected: user={user_id}")

    try:
        while True:
            # Keep connection alive, handle incoming pings
            data = await asyncio.wait_for(websocket.receive_text(), timeout=settings.WS_HEARTBEAT_INTERVAL)
            if data == "ping":
                await websocket.send_json({"event_type": "pong"})

    except asyncio.TimeoutError:
        # Send heartbeat
        try:
            await websocket.send_json({"event_type": "heartbeat"})
        except Exception:
            pass

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: user={user_id}")

    except Exception as e:
        logger.error(f"WebSocket error: {e}")

    finally:
        manager.disconnect(websocket)


@router.websocket("/admin")
async def admin_websocket(websocket: WebSocket, token: str = Query(...)):
    """Admin WebSocket — receives all platform events."""
    from app.core.security import decode_token

    try:
        payload = decode_token(token)
        is_admin = payload.get("is_admin", False)
        if not is_admin:
            await websocket.close(code=4003, reason="Admin access required")
            return
    except Exception:
        await websocket.close(code=4001, reason="Authentication failed")
        return

    await manager.connect(websocket, is_admin=True)

    try:
        while True:
            await asyncio.sleep(settings.WS_HEARTBEAT_INTERVAL)
            await websocket.send_json({"event_type": "heartbeat", "connections": manager.connection_count})
    except (WebSocketDisconnect, Exception):
        manager.disconnect(websocket)
