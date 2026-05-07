from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.domain.favorite.repository import FavoriteRepository
from app.domain.favorite.schema import FavoriteRead, FavoritesRead, FavoriteToggle
from app.domain.favorite.service import FavoriteService


router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("", response_model=FavoritesRead)
async def list_favorites(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = FavoriteRepository(db)
    service = FavoriteService(repo)
    return await service.list_favorites(current_user.id)


@router.post("", response_model=FavoriteRead)
async def add_favorite(
    data: FavoriteToggle,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = FavoriteRepository(db)
    service = FavoriteService(repo)
    return await service.add_favorite(current_user.id, data.product_uuid)


@router.delete("/{product_uuid}")
async def remove_favorite(
    product_uuid: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = FavoriteRepository(db)
    service = FavoriteService(repo)
    return await service.remove_favorite(current_user.id, product_uuid)
