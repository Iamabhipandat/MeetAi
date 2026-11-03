"""WebSocket connection manager for real-time WebRTC signaling and meeting updates."""

import logging
from typing import Dict, Set, Union
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections grouped by room_id (string or int)."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: Union[str, int]):
        await websocket.accept()
        key = str(room_id)
        if key not in self.active_connections:
            self.active_connections[key] = set()
        self.active_connections[key].add(websocket)
        logger.info("WebSocket connected for room %s (total: %d)",
                    key, len(self.active_connections[key]))

    def disconnect(self, websocket: WebSocket, room_id: Union[str, int]):
        key = str(room_id)
        if key in self.active_connections:
            self.active_connections[key].discard(websocket)
            if not self.active_connections[key]:
                del self.active_connections[key]
        logger.info("WebSocket disconnected for room %s", key)

    async def broadcast_to_meeting(self, room_id: Union[str, int], message: dict, sender_ws: WebSocket = None):
        """Send a JSON message to clients in a room, optionally skipping the sender."""
        key = str(room_id)
        if key not in self.active_connections:
            return
        disconnected = set()
        for connection in list(self.active_connections[key]):
            if sender_ws and connection == sender_ws:
                continue
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        for conn in disconnected:
            self.disconnect(conn, key)


# Singleton instance
manager = ConnectionManager()
