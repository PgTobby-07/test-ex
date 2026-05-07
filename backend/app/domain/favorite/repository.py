from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.product.model import Category, Favorite, Product


class FavoriteRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_product_by_uuid(self, product_uuid: str):
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.category), selectinload(Product.variants))
            .where(Product.uuid == product_uuid)
        )
        return result.scalar_one_or_none()

    async def get_favorite(self, user_id: int, product_id: int):
        result = await self.db.execute(
            select(Favorite)
            .options(
                selectinload(Favorite.product).selectinload(Product.category),
                selectinload(Favorite.product).selectinload(Product.variants),
            )
            .where(Favorite.user_id == user_id, Favorite.product_id == product_id)
        )
        return result.scalar_one_or_none()

    async def list_favorites(self, user_id: int):
        result = await self.db.execute(
            select(Favorite)
            .options(
                selectinload(Favorite.product).selectinload(Product.category),
                selectinload(Favorite.product).selectinload(Product.variants),
            )
            .where(Favorite.user_id == user_id)
            .join(Favorite.product)
            .order_by(Product.created_at.desc())
        )
        return result.scalars().all()

    async def add_favorite(self, favorite: Favorite):
        self.db.add(favorite)
        await self.db.commit()
        return await self.get_favorite(favorite.user_id, favorite.product_id)

    async def delete_favorite(self, favorite: Favorite):
        await self.db.delete(favorite)
        await self.db.commit()

