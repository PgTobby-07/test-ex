from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.product.model import Category, Order, OrderItem, Product, ProductVariant
from app.domain.user.model import User, UserRole


class DashboardRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_categories(self):
        result = await self.db.execute(select(Category).order_by(Category.name.asc()))
        return result.scalars().all()

    async def get_seller_products(self, seller_id: int):
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.category), selectinload(Product.variants))
            .where(Product.seller_id == seller_id)
            .order_by(Product.created_at.desc())
        )
        return result.scalars().all()

    async def get_seller_orders(self, seller_id: int):
        result = await self.db.execute(
            select(Order)
            .join(Order.items)
            .join(OrderItem.variant)
            .join(ProductVariant.product)
            .where(Product.seller_id == seller_id)
            .options(
                selectinload(Order.user),
                selectinload(Order.items)
                .selectinload(OrderItem.variant)
                .selectinload(ProductVariant.product)
                .selectinload(Product.category),
            )
            .order_by(Order.created_at.desc())
            .distinct()
        )
        return result.scalars().all()

    async def count_users(self):
        result = await self.db.execute(select(func.count(User.id)))
        return result.scalar_one() or 0

    async def count_users_by_role(self, role: UserRole):
        result = await self.db.execute(select(func.count(User.id)).where(User.role == role))
        return result.scalar_one() or 0

    async def count_products(self):
        result = await self.db.execute(select(func.count(Product.id)))
        return result.scalar_one() or 0

    async def count_orders(self):
        result = await self.db.execute(select(func.count(Order.id)))
        return result.scalar_one() or 0

    async def count_pending_orders(self):
        result = await self.db.execute(select(func.count(Order.id)).where(Order.status == "pending"))
        return result.scalar_one() or 0

    async def total_revenue(self):
        result = await self.db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(Order.payment_status == "paid")
        )
        return float(result.scalar_one() or 0)

    async def get_recent_users(self, limit: int = 8):
        result = await self.db.execute(select(User).order_by(User.created_at.desc()).limit(limit))
        return result.scalars().all()

    async def get_recent_products(self, limit: int = 8):
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.category), selectinload(Product.variants))
            .order_by(Product.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def get_recent_orders(self, limit: int = 8):
        result = await self.db.execute(
            select(Order)
            .options(
                selectinload(Order.user),
                selectinload(Order.items)
                .selectinload(OrderItem.variant)
                .selectinload(ProductVariant.product)
                .selectinload(Product.category),
            )
            .order_by(Order.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()
