from datetime import datetime, timedelta
import random

from app.domain.coupon.repository import CouponRepository
from app.domain.product.model import Coupon


class CouponService:
    def __init__(self, repo: CouponRepository):
        self.repo = repo

    async def _ensure_daily_coupons(self):
        now = datetime.utcnow()
        day_start = datetime(now.year, now.month, now.day)
        day_end = day_start + timedelta(days=1)

        coupons = await self.repo.get_coupons_created_between(day_start, day_end)
        if coupons:
            return

        random.seed(day_start.toordinal())
        percentages = random.sample([5, 10, 12, 15, 18, 20, 25], 3)
        labels = ["Morning Deal", "Daily Saver", "Flash Coupon"]

        generated_coupons = []
        for index, percent in enumerate(percentages):
            code = f"EWP-{day_start.strftime('%d%m%y')}-{percent}{index + 1}"
            generated_coupons.append(
                Coupon(
                    code=code,
                    title=f"{labels[index]} {percent}% OFF",
                    description="Generated fresh for today's deals. Expires by the end of the day.",
                    discount_percent=percent,
                    starts_at=day_start,
                    ends_at=day_end - timedelta(seconds=1),
                    is_active=True,
                )
            )

        await self.repo.create_many(generated_coupons)

    async def list_active_coupons(self):
        await self._ensure_daily_coupons()
        return await self.repo.get_active_coupons(datetime.utcnow())
