"""
WebSocket Connection Manager
─────────────────────────────
Manages real-time connections for live transaction streaming,
risk score updates, and alert notifications.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections with per-user subscription support.
    Broadcasts events to all connections or targeted users.
    """

    def __init__(self):
        # All active connections: websocket -> user_id (or None for admin)
        self.active_connections: Dict[WebSocket, Optional[int]] = {}
        # User-specific connections: user_id -> set of websockets
        self.user_connections: Dict[int, Set[WebSocket]] = {}
        # Admin connections (receive all events)
        self.admin_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, user_id: Optional[int] = None, is_admin: bool = False):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections[websocket] = user_id

        if is_admin:
            self.admin_connections.add(websocket)
            logger.info(f"Admin WebSocket connected. Total: {len(self.admin_connections)}")
        elif user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(websocket)
            logger.info(f"User {user_id} WebSocket connected. Connections: {len(self.user_connections[user_id])}")

        # Send initial heartbeat
        await self.send_personal_message(
            websocket,
            {"event_type": "connected", "message": "Mirage real-time stream active", "timestamp": datetime.utcnow().isoformat()}
        )

    def disconnect(self, websocket: WebSocket):
        """Remove and clean up a disconnected WebSocket."""
        user_id = self.active_connections.pop(websocket, None)

        if websocket in self.admin_connections:
            self.admin_connections.discard(websocket)

        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        logger.info(f"WebSocket disconnected. User: {user_id}. Active: {len(self.active_connections)}")

    async def send_personal_message(self, websocket: WebSocket, data: dict):
        """Send a message to a specific WebSocket connection."""
        try:
            await websocket.send_json(data)
        except Exception as e:
            logger.warning(f"Failed to send to WebSocket: {e}")
            self.disconnect(websocket)

    async def broadcast_to_user(self, user_id: int, event: dict):
        """Broadcast an event to all connections for a specific user."""
        connections = self.user_connections.get(user_id, set()).copy()
        disconnected = set()

        for websocket in connections:
            try:
                await websocket.send_json(event)
            except Exception:
                disconnected.add(websocket)

        # Clean up dead connections
        for ws in disconnected:
            self.disconnect(ws)

    async def broadcast_to_admins(self, event: dict):
        """Broadcast an event to all admin connections."""
        disconnected = set()

        for websocket in self.admin_connections.copy():
            try:
                await websocket.send_json(event)
            except Exception:
                disconnected.add(websocket)

        for ws in disconnected:
            self.disconnect(ws)

    async def broadcast_global(self, event: dict):
        """Broadcast to ALL connected clients."""
        disconnected = set()

        for websocket in self.active_connections.copy():
            try:
                await websocket.send_json(event)
            except Exception:
                disconnected.add(websocket)

        for ws in disconnected:
            self.disconnect(ws)

    async def emit_transaction(self, transaction_data: dict, user_id: int):
        """Emit a new transaction event."""
        event = {
            "event_type": "transaction",
            "user_id": user_id,
            "data": transaction_data,
            "timestamp": datetime.utcnow().isoformat(),
        }
        await self.broadcast_to_user(user_id, event)
        await self.broadcast_to_admins(event)

    async def emit_risk_update(self, risk_data: dict, user_id: int):
        """Emit a risk score update event."""
        event = {
            "event_type": "risk_update",
            "user_id": user_id,
            "data": risk_data,
            "timestamp": datetime.utcnow().isoformat(),
        }
        await self.broadcast_to_user(user_id, event)
        await self.broadcast_to_admins(event)

    async def emit_alert(self, alert_data: dict, user_id: int):
        """Emit a new alert event."""
        event = {
            "event_type": "alert",
            "user_id": user_id,
            "data": alert_data,
            "timestamp": datetime.utcnow().isoformat(),
        }
        await self.broadcast_to_user(user_id, event)
        await self.broadcast_to_admins(event)

    async def send_heartbeat(self):
        """Send heartbeat to all connections."""
        event = {
            "event_type": "heartbeat",
            "timestamp": datetime.utcnow().isoformat(),
            "active_connections": len(self.active_connections),
        }
        await self.broadcast_global(event)

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)


# Singleton manager instance
manager = ConnectionManager()
