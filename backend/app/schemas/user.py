from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# ─── Request Schemas ───────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ─── Response Schemas ──────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool
    is_verified: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut
