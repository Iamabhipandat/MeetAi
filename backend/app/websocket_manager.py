"""WebSocket connection manager for real-time meeting updates."""

import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections grouped by meeting_id."""

    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, meeting_id: int):
        await websocket.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = set()
        self.active_connections[meeting_id].add(websocket)
        logger.info("WebSocket connected for meeting %s (total: %d)",
                     meeting_id, len(self.active_connections[meeting_id]))

    def disconnect(self, websocket: WebSocket, meeting_id: int):
        if meeting_id in self.active_connections:
            self.active_connections[meeting_id].discard(websocket)
            if not self.active_connections[meeting_id]:
                del self.active_connections[meeting_id]
        logger.info("WebSocket disconnected for meeting %s", meeting_id)

    async def broadcast_to_meeting(self, meeting_id: int, message: dict):
        """Send a JSON message to all connected clients for a meeting."""
        if meeting_id not in self.active_connections:
            return
        disconnected = set()
        for connection in self.active_connections[meeting_id]:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        for conn in disconnected:
            self.disconnect(conn, meeting_id)


# Singleton instance
manager = ConnectionManager()
