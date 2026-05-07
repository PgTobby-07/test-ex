from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.domain.order.repository import OrderRepository
from app.domain.order.service import OrderService
from app.domain.order.schema import OrderRead, PaymentIntentResponse, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/checkout", response_model=OrderRead)
async def checkout(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = OrderRepository(db)
    service = OrderService(repo)

    return await service.checkout(current_user.id)

@router.get("", response_model=list[OrderRead])
async def get_orders(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = OrderRepository(db)
    service = OrderService(repo)

    return await service.get_user_orders(current_user.id)

@router.post("/checkout/payment-intent", response_model=PaymentIntentResponse)
async def checkout_payment_intent(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = OrderRepository(db)
    service = OrderService(repo)

    return await service.create_checkout_payment_intent(current_user.id)

@router.patch("/{order_uuid}/status", response_model=OrderRead)
async def update_order_status(
    order_uuid: str,
    data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = OrderRepository(db)
    service = OrderService(repo)

    return await service.update_order_status(order_uuid, data.status, current_user)

@router.post("/{order_uuid}/confirm", response_model=OrderRead)
async def confirm_order(
    order_uuid: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = OrderRepository(db)
    service = OrderService(repo)

    return await service.confirm_order(order_uuid, current_user)

@router.delete("/{order_uuid}")
async def delete_order(
    order_uuid: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = OrderRepository(db)
    service = OrderService(repo)

    return await service.delete_order(order_uuid, current_user)
