from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.product.model import Cart, CartItem, Coupon, Product, ProductVariant

class CartRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_cart(self, user_id: int):
        cart = Cart(user_id=user_id)
        self.db.add(cart)
        await self.db.commit()
        await self.db.refresh(cart)
        return cart

    async def get_variant(self, variant_id: int):
        result = await self.db.execute(
            select(ProductVariant)
            .options(selectinload(ProductVariant.product).selectinload(Product.category))
            .where(ProductVariant.id == variant_id)
        )
        return result.scalar_one_or_none()

    async def get_cart_item(self, cart_id: int, variant_id: int):
        result = await self.db.execute(
            select(CartItem)
            .options(
                selectinload(CartItem.variant)
                .selectinload(ProductVariant.product)
                .selectinload(Product.category)
            )
            .where(
                CartItem.cart_id == cart_id,
                CartItem.variant_id == variant_id,
            )
        )
        return result.scalar_one_or_none()

    async def add_item(self, item: CartItem):
        self.db.add(item)
        await self.db.commit()
        return await self.get_cart_item(item.cart_id, item.variant_id)

    async def save(self):
        await self.db.commit()

    async def get_cart_by_user(self, user_id: int):
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
    
    async def delete_item(self, item: CartItem):
        await self.db.delete(item)
        await self.db.commit()

    async def get_coupon_by_code(self, code: str):
        result = await self.db.execute(
            select(Coupon).where(Coupon.code == code.upper())
        )
        return result.scalar_one_or_none()
