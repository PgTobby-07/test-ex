from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.product.model import Cart, CartItem, Order, OrderItem, Product, ProductVariant


class OrderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_cart_with_items(self, user_id: int):
        result = await self.db.execute(
            select(Cart)
            .options(
                selectinload(Cart.applied_coupon),
                selectinload(Cart.items)
                .selectinload(CartItem.variant)
                .selectinload(ProductVariant.product)
                .selectinload(Product.category)
            )
            .where(Cart.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_order(self, order: Order):
        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)
        return order

    async def get_order_with_items(self, order_id: int):
        result = await self.db.execute(
            select(Order)
            .options(
                selectinload(Order.user),
                selectinload(Order.items)
                .selectinload(OrderItem.variant)
                .selectinload(ProductVariant.product)
                .selectinload(Product.category)
            )
            .where(Order.id == order_id)
        )
        return result.scalar_one()

    async def clear_cart(self, cart: Cart):
        for item in cart.items:
            await self.db.delete(item)

        await self.db.commit()

    async def clear_cart_by_user_id(self, user_id: int):
        cart = await self.get_cart_with_items(user_id)

        if not cart:
            return

        await self.clear_cart(cart)

    async def get_orders_by_user(self, user_id: int):
        result = await self.db.execute(
            select(Order)
            .options(
                selectinload(Order.user),
                selectinload(Order.items)
                .selectinload(OrderItem.variant)
                .selectinload(ProductVariant.product)
                .selectinload(Product.category)
            )
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
        )
        return result.scalars().all()
    
    async def save(self):
        await self.db.commit()

    async def get_order_by_payment_intent(self, payment_intent_id: str):
        result = await self.db.execute(
            select(Order)
            .options(
                selectinload(Order.user),
                selectinload(Order.items)
                .selectinload(OrderItem.variant)
                .selectinload(ProductVariant.product)
                .selectinload(Product.category)
            )
            .where(Order.stripe_payment_intent_id == payment_intent_id)
        )
        return result.scalar_one_or_none()
        
    async def mark_order_paid(self, payment_intent_id: str):
        order = await self.get_order_by_payment_intent(payment_intent_id)

        if not order:
            print("❌ No order found for:", payment_intent_id)
            return None

        print("🔥 BEFORE UPDATE:", order.id, order.payment_status)

        order.payment_status = "paid"
        order.status = "confirmed"

        await self.db.commit()
        await self.db.refresh(order)

        print("✅ AFTER UPDATE:", order.id, order.payment_status)

        return order
    
    async def get_order_by_uuid(self, order_uuid: str):
        result = await self.db.execute(
            select(Order)
            .options(
                selectinload(Order.user),
                selectinload(Order.items)
                .selectinload(OrderItem.variant)
                .selectinload(ProductVariant.product)
                .selectinload(Product.category)
            )
            .where(Order.uuid == order_uuid)
        )
        return result.scalar_one_or_none()

    async def delete_order(self, order: Order):
        await self.db.delete(order)
        await self.db.commit()
