from fastapi import HTTPException, status

from app.domain.favorite.repository import FavoriteRepository
from app.domain.product.model import Favorite


class FavoriteService:
    def __init__(self, repo: FavoriteRepository):
        self.repo = repo

    async def list_favorites(self, user_id: int):
        items = await self.repo.list_favorites(user_id)
        return {
            "items": items,
            "count": len(items),
        }

    async def add_favorite(self, user_id: int, product_uuid: str):
        product = await self.repo.get_product_by_uuid(product_uuid)

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        favorite = await self.repo.get_favorite(user_id, product.id)
        if favorite:
            return favorite

        return await self.repo.add_favorite(
            Favorite(user_id=user_id, product_id=product.id)
        )

    async def remove_favorite(self, user_id: int, product_uuid: str):
        product = await self.repo.get_product_by_uuid(product_uuid)

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        favorite = await self.repo.get_favorite(user_id, product.id)
        if not favorite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Favorite not found",
            )

        await self.repo.delete_favorite(favorite)
        return {"message": "Favorite removed"}
