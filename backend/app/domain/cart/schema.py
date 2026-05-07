from pydantic import BaseModel, Field


class VariantAttributeRead(BaseModel):
    key: str
    value: str


class AddCartItem(BaseModel):
    variant_id: int
    quantity: int = 1


class CartItemRead(BaseModel):
    id: int
    variant_id: int
    product_id: int | None = None
    product_uuid: str | None = None
    product_title: str | None = None
    product_image_url: str | None = None
    category_name: str | None = None
    category_slug: str | None = None
    unit_price: float = 0
    line_total: float = 0
    attributes: list[VariantAttributeRead] = Field(default_factory=list)
    size: str | None = None
    color: str | None = None
    storage: str | None = None
    stock: int = 0
    quantity: int

    model_config = {"from_attributes": True}


class CartRead(BaseModel):
    id: int
    user_id: int
    items_count: int = 0
    subtotal: float = 0
    discount_percent: int = 0
    discount_amount: float = 0
    total_after_discount: float = 0
    applied_coupon_code: str | None = None
    items: list[CartItemRead] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class ApplyCouponInput(BaseModel):
    code: str
