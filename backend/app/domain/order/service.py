from fastapi import HTTPException
import stripe

from app.domain.order.repository import OrderRepository
from app.domain.product.model import Order, OrderItem
from app.domain.user.model import User, UserRole

from app.core.stripe import create_payment_intent

class OrderService:
    def __init__(self, repo: OrderRepository):
        self.repo = repo

    async def _build_order_from_cart(self, user_id: int):
        cart = await self.repo.get_cart_with_items(user_id)

        if not cart or not cart.items:
            raise HTTPException(
                status_code=400,
                detail="Cart is empty",
            )

        total = 0
        order_items = []

        for item in cart.items:
            variant = item.variant
            price = variant.price if variant.price is not None else variant.product.price
            total += price * item.quantity

            order_items.append(
                OrderItem(
                    variant_id=variant.id,
                    quantity=item.quantity,
                    price=price,
                )
            )

        total = float(cart.total_after_discount)
        return cart, total, order_items

    async def checkout(self, user_id: int):
        cart, total, order_items = await self._build_order_from_cart(user_id)
        order = Order(
            user_id=user_id,
            total_amount=total,
            status="pending",
            items=order_items,
        )

        created_order = await self.repo.create_order(order)
        await self.repo.clear_cart(cart)

        return await self.repo.get_order_with_items(created_order.id)
    
    async def get_user_orders(self, user_id: int):
        return await self.repo.get_orders_by_user(user_id)
    
    async def create_checkout_payment_intent(self, user_id: int):
        _, total, order_items = await self._build_order_from_cart(user_id)

        order = Order(
            user_id=user_id,
            total_amount=total,
            status="pending",
            items=order_items,
        )

        order = await self.repo.create_order(order)

        amount_cents = int(order.total_amount * 100)
        try:
            intent = create_payment_intent(
                amount=amount_cents,
                currency="usd",
            )
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error
        except stripe.error.StripeError as error:
            raise HTTPException(
                status_code=502,
                detail=error.user_message or str(error),
            ) from error
        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=f"Stripe checkout failed: {error}",
            ) from error

        order.stripe_payment_intent_id = intent.id
        order.payment_status = "pending"
        await self.repo.save()

        return {
            "order_uuid": order.uuid,
            "client_secret": intent.client_secret,
            "amount": order.total_amount,
            "status": order.status,
            "payment_status": order.payment_status,
        }
    
    def _can_manage_order(self, actor: User, order: Order) -> bool:
        if actor.role in {UserRole.admin, UserRole.superadmin}:
            return True

        if order.user_id == actor.id:
            return True

        return any(item.seller_id == actor.id for item in order.items)

    async def update_order_status(self, order_uuid: str, status: str, actor: User):
        allowed_statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"]

        if status not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail="Invalid order status",
            )

        order = await self.repo.get_order_by_uuid(order_uuid)

        if not order:
            raise HTTPException(
                status_code=404,
                detail="Order not found",
            )

        if not self._can_manage_order(actor, order):
            raise HTTPException(
                status_code=403,
                detail="Not allowed",
            )

        order.status = status
        await self.repo.save()

        return order

    async def confirm_order(self, order_uuid: str, actor: User):
        order = await self.repo.get_order_by_uuid(order_uuid)

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if not self._can_manage_order(actor, order):
            raise HTTPException(status_code=403, detail="Not allowed")

        if order.status != "pending":
            raise HTTPException(status_code=400, detail="Only pending orders can be confirmed")

        order.status = "confirmed"
        await self.repo.save()
        return order

    async def delete_order(self, order_uuid: str, actor: User):
        order = await self.repo.get_order_by_uuid(order_uuid)

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order.user_id != actor.id and actor.role not in {UserRole.admin, UserRole.superadmin}:
            raise HTTPException(status_code=403, detail="Not allowed")

        if order.status != "pending":
            raise HTTPException(status_code=400, detail="Only pending orders can be deleted")

        if order.payment_status == "paid":
            raise HTTPException(status_code=400, detail="Paid orders cannot be deleted")

        await self.repo.delete_order(order)
        return {"message": "Order deleted"}
