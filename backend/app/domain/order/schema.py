from datetime import datetime

from pydantic import BaseModel, Field


class VariantAttributeRead(BaseModel):
    key: str
    value: str


class OrderItemRead(BaseModel):
    id: int
    variant_id: int
    quantity: int
    price: float
    product_uuid: str | None = None
    product_title: str | None = None
    product_image_url: str | None = None
    category_name: str | None = None
    attributes: list[VariantAttributeRead] = Field(default_factory=list)
    size: str | None = None
    color: str | None = None
    storage: str | None = None
    seller_id: int | None = None

    model_config = {"from_attributes": True}


class OrderRead(BaseModel):
    uuid: str
    total_amount: float
    status: str
    payment_status: str
    created_at: datetime
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    items: list[OrderItemRead] = Field(default_factory=list)

    model_config = {"from_attributes": True}

class PaymentIntentResponse(BaseModel):
    order_uuid: str
    client_secret: str
    amount: float
    status: str
    payment_status: str

class OrderStatusUpdate(BaseModel):
    status: str
