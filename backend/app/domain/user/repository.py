from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.user.model import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def save(self, user: User) -> User:
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_by_uuid(self, user_uuid: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.uuid == user_uuid)
        )
        return result.scalar_one_or_none()

    async def delete(self, user: User):
        await self.db.delete(user)
        await self.db.commit()
