from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str | None = None
    role: Literal["customer", "buyer", "seller"] = "buyer"
    phone: str | None = None
    shop_name: str | None = None

class UserRead(BaseModel):
    uuid: str
    email: str
    full_name: str | None
    role: str
    phone: str | None
    avatar_url: str | None
    is_active: bool
    is_banned: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
