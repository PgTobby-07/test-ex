from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.product.model import Coupon


class CouponRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_active_coupons(self, now: datetime):
        result = await self.db.execute(
            select(Coupon)
            .where(
                Coupon.is_active.is_(True),
                Coupon.starts_at <= now,
                Coupon.ends_at >= now,
            )
            .order_by(Coupon.discount_percent.desc(), Coupon.ends_at.asc())
        )
        return result.scalars().all()

    async def get_coupon_by_code(self, code: str):
        result = await self.db.execute(
            select(Coupon).where(Coupon.code == code.upper())
        )
        return result.scalar_one_or_none()

    async def get_coupons_created_between(self, start: datetime, end: datetime):
        result = await self.db.execute(
            select(Coupon).where(
                Coupon.created_at >= start,
                Coupon.created_at < end,
            )
        )
        return result.scalars().all()

    async def create_many(self, coupons: list[Coupon]):
        self.db.add_all(coupons)
        await self.db.commit()

