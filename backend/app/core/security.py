from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

# Password hashing context — uses bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme — auto_error=False allows guest/public access without token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_default_guest_user(db: Session) -> User:
    """Provides a permanent guest user so any user can host or join meetings without auth."""
    guest = db.query(User).filter(User.email == "guest@meetai.local").first()
    if not guest:
        guest = User(
            name="Guest User",
            email="guest@meetai.local",
            password_hash=hash_password("guest123"),
            is_active=True,
            is_verified=True,
        )
        db.add(guest)
        db.commit()
        db.refresh(guest)
    return guest


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """If token is provided, authenticate user. Otherwise, seamlessly fallback to default guest user."""
    if not token:
        return get_default_guest_user(db)

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: Optional[int] = payload.get("sub")
        if user_id is not None:
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user:
                return user
    except Exception:
        pass

    return get_default_guest_user(db)


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user
