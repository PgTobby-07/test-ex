from pydantic import BaseModel, Field

from app.domain.product.schema import ProductRead


class FavoriteToggle(BaseModel):
    product_uuid: str


class FavoriteRead(BaseModel):
    id: int
    product: ProductRead

    model_config = {"from_attributes": True}


class FavoritesRead(BaseModel):
    items: list[FavoriteRead] = Field(default_factory=list)
    count: int = 0

