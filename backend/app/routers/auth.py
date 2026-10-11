import secrets
import threading
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_active_user
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserOut, Token
from app.services.email_service import send_verification_email, send_welcome_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Register a new user.
    DEV MODE (no GMAIL_USER set): auto-verifies and returns JWT immediately.
    PRODUCTION (GMAIL_USER set): sends verification email first.
    """
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    dev_mode = not settings.GMAIL_USER
    verification_token = None if dev_mode else secrets.token_urlsafe(32)

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        is_verified=dev_mode,
        verification_token=verification_token,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if dev_mode:
        # No email config — auto login directly
        token = create_access_token(data={"sub": str(user.id)})
        return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

    # Production — send email and ask user to verify
    background_tasks.add_task(send_verification_email, user.email, user.name, verification_token)
    return {
        "message": "Account created! Please check your email to verify your account.",
        "email": user.email,
    }


@router.get("/verify")
def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify email via token from the email link."""
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    user.is_verified = True
    user.verification_token = None
    db.commit()
    db.refresh(user)

    # Send welcome email in background
    threading.Thread(target=send_welcome_email, args=(user.email, user.name), daemon=True).start()

    jwt_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=jwt_token, token_type="bearer", user=UserOut.model_validate(user))


@router.post("/resend-verification", status_code=200)
def resend_verification(email: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Resend verification email."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email is already verified")

    new_token = secrets.token_urlsafe(32)
    user.verification_token = new_token
    db.commit()

    background_tasks.add_task(send_verification_email, user.email, user.name, new_token)
    return {"message": "Verification email resent"}


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Login. Returns JWT token."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password",
                            headers={"WWW-Authenticate": "Bearer"})

    dev_mode = not settings.GMAIL_USER
    if not user.is_verified:
        if dev_mode:
            user.is_verified = True
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(status_code=403, detail="Please verify your email before logging in")

    token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user
