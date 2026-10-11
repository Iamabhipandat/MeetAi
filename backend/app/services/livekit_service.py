import secrets
import string
from app.core.config import settings

try:
    from livekit import api as livekit_api
    LIVEKIT_AVAILABLE = True
except ImportError:
    LIVEKIT_AVAILABLE = False
    print("[WARNING] livekit-api not installed. Using mock tokens.")


def generate_join_code(length: int = 8) -> str:
    """Generate a short random join code like 'AX3K9QWZ'."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


def generate_room_name(meeting_id: int) -> str:
    return f"meeting-{meeting_id}-{secrets.token_hex(4)}"


def generate_participant_token(room_name: str, participant_name: str, is_host: bool = False) -> str:
    """Generate a LiveKit JWT for a participant to join a room."""
    if not LIVEKIT_AVAILABLE:
        # Return a mock token for dev without LiveKit
        return f"mock-token-{room_name}-{participant_name}"

    try:
        grants = livekit_api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
            room_admin=is_host,
        )
        token = (
            livekit_api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
            .with_identity(participant_name)
            .with_name(participant_name)
            .with_grants(grants)
            .to_jwt()
        )
        return token
    except Exception as e:
        print(f"[LiveKit] Token error: {e}")
        return f"mock-token-{room_name}-{participant_name}"
