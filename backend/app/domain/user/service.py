from fastapi import HTTPException, status

from app.core.security import create_access_token, hash_password, verify_password
from app.domain.user.model import User, UserRole
from app.domain.user.repository import UserRepository
from app.domain.user.schema import UserCreate, UserLogin, UserUpdate

class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    @staticmethod
    def _normalize_role(role: str) -> UserRole:
        if role == "seller":
            return UserRole.seller
        return UserRole.customer

    async def register_user(self, data: UserCreate) -> User:
        existing_user = await self.repository.get_by_email(data.email)

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        user = User(
            email=data.email.lower(),
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            role=self._normalize_role(data.role),
            phone=data.phone,
        )

        return await self.repository.create(user)
    
    async def login_user(self, data: UserLogin) -> str:
        user = await self.repository.get_by_email(data.email.lower())

        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if user.is_banned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is banned",
            )

        access_token = create_access_token(
            data={
                "sub": user.uuid,
                "role": user.role.value,
            }
        )

        return access_token

    async def update_user(self, user: User, data: UserUpdate) -> User:
        if data.full_name is not None:
            user.full_name = data.full_name.strip() or None

        if data.phone is not None:
            user.phone = data.phone.strip() or None

        if data.avatar_url is not None:
            user.avatar_url = data.avatar_url.strip() or None

        return await self.repository.save(user)
