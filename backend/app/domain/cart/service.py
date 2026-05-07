from datetime import datetime

from fastapi import HTTPException, status

from app.domain.product.model import CartItem
from app.domain.cart.repository import CartRepository
from app.domain.cart.schema import AddCartItem


class CartService:
    def __init__(self, repo: CartRepository):
        self.repo = repo

    async def get_or_create_cart(self, user_id: int):
        cart = await self.repo.get_cart_by_user(user_id)

        if not cart:
            cart = await self.repo.create_cart(user_id)

        return cart

    async def add_to_cart(self, user_id: int, data: AddCartItem):
        variant = await self.repo.get_variant(data.variant_id)

        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Variant not found",
            )

        if data.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be greater than 0",
            )

        if variant.stock < data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not enough stock",
            )

        cart = await self.get_or_create_cart(user_id)

        item = await self.repo.get_cart_item(cart.id, data.variant_id)

        if item:
            next_quantity = item.quantity + data.quantity

            if variant.stock < next_quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Not enough stock",
                )

            item.quantity = next_quantity
            await self.repo.save()
            return await self.repo.get_cart_item(cart.id, data.variant_id)

        item = CartItem(
            cart_id=cart.id,
            variant_id=data.variant_id,
            quantity=data.quantity,
        )

        return await self.repo.add_item(item)
    
    async def get_cart(self, user_id: int):
        return await self.get_or_create_cart(user_id)
    
    async def update_item(
        self,
        user_id: int,
        variant_id: int,
        quantity: int,
    ):
        if quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="Quantity must be greater than 0",
            )

        cart = await self.get_or_create_cart(user_id)

        item = await self.repo.get_cart_item(cart.id, variant_id)

        if not item:
            raise HTTPException(
                status_code=404,
                detail="Item not found in cart",
            )

        variant = await self.repo.get_variant(variant_id)

        if not variant:
            raise HTTPException(
                status_code=404,
                detail="Variant not found",
            )

        if variant.stock < quantity:
            raise HTTPException(
                status_code=400,
                detail="Not enough stock",
            )

        item.quantity = quantity
        await self.repo.save()

        return await self.repo.get_cart_item(cart.id, variant_id)


    async def remove_item(
        self,
        user_id: int,
        variant_id: int,
    ):
        cart = await self.get_or_create_cart(user_id)

        item = await self.repo.get_cart_item(cart.id, variant_id)

        if not item:
            raise HTTPException(
                status_code=404,
                detail="Item not found",
            )

        await self.repo.delete_item(item)

        return {"message": "Item removed"}

    async def apply_coupon(self, user_id: int, code: str):
        cart = await self.get_or_create_cart(user_id)
        coupon = await self.repo.get_coupon_by_code(code.strip().upper())

        if not coupon:
            raise HTTPException(status_code=404, detail="Coupon not found")

        now = datetime.utcnow()
        if not coupon.is_active or coupon.starts_at > now or coupon.ends_at < now:
            raise HTTPException(status_code=400, detail="Coupon is expired")

        cart.applied_coupon_id = coupon.id
        await self.repo.save()

        return await self.get_or_create_cart(user_id)

    async def remove_coupon(self, user_id: int):
        cart = await self.get_or_create_cart(user_id)
        cart.applied_coupon_id = None
        await self.repo.save()
        return await self.get_or_create_cart(user_id)
