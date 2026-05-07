from datetime import datetime

from pydantic import BaseModel, Field

from app.domain.order.schema import OrderRead
from app.domain.product.schema import CategoryRead, ProductRead
from app.domain.user.schema import UserRead


class SellerDashboardStatsRead(BaseModel):
    product_count: int
    order_count: int
    pending_order_count: int
    customer_count: int
    total_revenue: float


class SellerCustomerRead(BaseModel):
    uuid: str
    full_name: str | None
    email: str
    phone: str | None
    order_count: int
    total_spent: float
    last_order_at: datetime | None = None


class SellerDashboardRead(BaseModel):
    stats: SellerDashboardStatsRead
    categories: list[CategoryRead] = Field(default_factory=list)
    products: list[ProductRead] = Field(default_factory=list)
    orders: list[OrderRead] = Field(default_factory=list)
    customers: list[SellerCustomerRead] = Field(default_factory=list)


class AdminDashboardStatsRead(BaseModel):
    user_count: int
    seller_count: int
    customer_count: int
    product_count: int
    order_count: int
    pending_order_count: int
    total_revenue: float


class AdminDashboardRead(BaseModel):
    stats: AdminDashboardStatsRead
    categories: list[CategoryRead] = Field(default_factory=list)
    recent_users: list[UserRead] = Field(default_factory=list)
    recent_products: list[ProductRead] = Field(default_factory=list)
    recent_orders: list[OrderRead] = Field(default_factory=list)
