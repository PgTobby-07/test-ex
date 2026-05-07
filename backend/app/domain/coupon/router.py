from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domain.coupon.repository import CouponRepository
from app.domain.coupon.schema import CouponRead
from app.domain.coupon.service import CouponService

router = APIRouter(prefix="/coupons", tags=["Coupons"])


@router.get("", response_model=list[CouponRead])
async def get_active_coupons(
    db: AsyncSession = Depends(get_db),
):
    repo = CouponRepository(db)
    service = CouponService(repo)
    return await service.list_active_coupons()
