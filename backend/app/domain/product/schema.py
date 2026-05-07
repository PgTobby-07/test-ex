from datetime import datetime

from pydantic import BaseModel, Field


class VariantAttribute(BaseModel):
    key: str
    value: str


class CategoryCreate(BaseModel):
    name: str
    slug: str
    parent_id: int | None = None


class CategoryRead(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class AttributeFacetRead(BaseModel):
    key: str
    values: list[str]


class VariantCreate(BaseModel):
    attributes: list[VariantAttribute] = Field(default_factory=list)
    price: float | None = None
    stock: int = 0


class VariantRead(BaseModel):
    id: int
    sku: str
    attributes: list[VariantAttribute] = Field(default_factory=list)
    size: str | None
    color: str | None
    storage: str | None
    price: float | None
    stock: int

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    title: str
    description: str | None = None
    image_url: str | None = None
    price: float
    category_id: int
    variants: list[VariantCreate] = Field(default_factory=list)


class ProductRead(BaseModel):
    id: int
    uuid: str
    title: str
    description: str | None
    image_url: str | None = None
    price: float
    category_id: int
    category_name: str | None = None
    category_slug: str | None = None
    default_variant_id: int | None = None
    available_stock: int = 0
    variants: list[VariantRead] = Field(default_factory=list)
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductFilterOptionsRead(BaseModel):
    categories: list[CategoryRead]
    attribute_facets: list[AttributeFacetRead]
    sizes: list[str]
    colors: list[str]
    storages: list[str]
    min_price: float | None = None
    max_price: float | None = None


class ProductListRead(BaseModel):
    items: list[ProductRead]
    total: int
    page: int
    limit: int
    total_pages: int


class HomeFeedSection(BaseModel):
    title: str
    subtitle: str
    items: list[ProductRead]


class HomeFeedRead(BaseModel):
    latest_items: HomeFeedSection
    popular_items: HomeFeedSection
    most_used_items: HomeFeedSection
    offers: HomeFeedSection
    related_items: HomeFeedSection
    categories: list[CategoryRead]


class ProductUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    image_url: str | None = None
    price: float | None = None
    category_id: int | None = None
