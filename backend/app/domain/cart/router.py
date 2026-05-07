from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.domain.cart.repository import CartRepository
from app.domain.cart.service import CartService
from app.domain.cart.schema import AddCartItem, ApplyCouponInput, CartItemRead, CartRead

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.post("/items", response_model=CartItemRead)
async def add_to_cart(
    data: AddCartItem,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = CartRepository(db)
    service = CartService(repo)

    return await service.add_to_cart(
        user_id=current_user.id,
        data=data,
    )

@router.get("", response_model=CartRead)
async def get_cart(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = CartRepository(db)
    service = CartService(repo)

    return await service.get_cart(current_user.id)

@router.patch("/items/{variant_id}", response_model=CartItemRead)
async def update_item(
    variant_id: int,
    quantity: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = CartRepository(db)
    service = CartService(repo)

    return await service.update_item(
        user_id=current_user.id,
        variant_id=variant_id,
        quantity=quantity,
    )


@router.delete("/items/{variant_id}")
async def remove_item(
    variant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = CartRepository(db)
    service = CartService(repo)

    return await service.remove_item(
        user_id=current_user.id,
        variant_id=variant_id,
    )


@router.post("/coupon", response_model=CartRead)
async def apply_coupon(
    data: ApplyCouponInput,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = CartRepository(db)
    service = CartService(repo)

    return await service.apply_coupon(
        user_id=current_user.id,
        code=data.code,
    )


@router.delete("/coupon", response_model=CartRead)
async def remove_coupon(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = CartRepository(db)
    service = CartService(repo)

    return await service.remove_coupon(current_user.id)
