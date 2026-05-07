from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, LargeBinary, String, Text
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.base import BaseModel


class Category(BaseModel):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)

    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id"),
        nullable=True,
    )

    parent = relationship("Category", remote_side="Category.id")

class Product(BaseModel):
    __tablename__ = "products"

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    image_data: Mapped[bytes | None] = mapped_column(
        LargeBinary().with_variant(mysql.MEDIUMBLOB(), "mysql"),
        nullable=True,
    )
    image_content_type: Mapped[str | None] = mapped_column(String(120), nullable=True)

    price: Mapped[float] = mapped_column(nullable=False)

    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))

    category = relationship("Category")

    @property
    def category_name(self) -> str | None:
        return self.category.name if self.category else None

    @property
    def category_slug(self) -> str | None:
        return self.category.slug if self.category else None

    @property
    def default_variant(self):
        variants = getattr(self, "variants", None) or []

        in_stock_variant = next((variant for variant in variants if variant.stock > 0), None)
        return in_stock_variant or (variants[0] if variants else None)

    @property
    def default_variant_id(self) -> int | None:
        variant = self.default_variant
        return variant.id if variant else None

    @property
    def available_stock(self) -> int:
        variants = getattr(self, "variants", None) or []
        return sum(max(variant.stock, 0) for variant in variants)

class ProductVariant(BaseModel):
    __tablename__ = "product_variants"

    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)

    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    storage: Mapped[str | None] = mapped_column(String(50), nullable=True)
    attributes: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list, nullable=False)

    price: Mapped[float | None] = mapped_column(nullable=True)
    stock: Mapped[int] = mapped_column(default=0, nullable=False)

    product = relationship("Product", backref="variants")

class Cart(BaseModel):
    __tablename__ = "carts"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    applied_coupon_id: Mapped[int | None] = mapped_column(ForeignKey("coupons.id"), nullable=True)

    items = relationship("CartItem", backref="cart")
    applied_coupon = relationship("Coupon")

    @property
    def items_count(self) -> int:
        return sum(item.quantity for item in self.items)

    @property
    def subtotal(self) -> float:
        return float(sum(item.line_total for item in self.items))

    @property
    def discount_percent(self) -> int:
        coupon = getattr(self, "applied_coupon", None)
        return coupon.discount_percent if coupon and coupon.is_currently_active else 0

    @property
    def applied_coupon_code(self) -> str | None:
        coupon = getattr(self, "applied_coupon", None)
        return coupon.code if coupon and coupon.is_currently_active else None

    @property
    def discount_amount(self) -> float:
        if self.discount_percent <= 0:
            return 0.0

        return float(round(self.subtotal * (self.discount_percent / 100), 2))

    @property
    def total_after_discount(self) -> float:
        return float(max(self.subtotal - self.discount_amount, 0.0))


class CartItem(BaseModel):
    __tablename__ = "cart_items"

    cart_id: Mapped[int] = mapped_column(ForeignKey("carts.id"), nullable=False)
    variant_id: Mapped[int] = mapped_column(ForeignKey("product_variants.id"), nullable=False)

    quantity: Mapped[int] = mapped_column(default=1)

    variant = relationship("ProductVariant")

    @property
    def product(self) -> Product | None:
        return self.variant.product if self.variant else None

    @property
    def product_id(self) -> int | None:
        return self.product.id if self.product else None

    @property
    def product_uuid(self) -> str | None:
        return self.product.uuid if self.product else None

    @property
    def product_title(self) -> str | None:
        return self.product.title if self.product else None

    @property
    def product_image_url(self) -> str | None:
        return self.product.image_url if self.product else None

    @property
    def category_name(self) -> str | None:
        return self.product.category_name if self.product else None

    @property
    def category_slug(self) -> str | None:
        return self.product.category_slug if self.product else None

    @property
    def unit_price(self) -> float:
        if not self.variant:
            return 0.0

        if self.variant.price is not None:
            return float(self.variant.price)

        return float(self.variant.product.price)

    @property
    def line_total(self) -> float:
        return float(self.unit_price * self.quantity)

    @property
    def size(self) -> str | None:
        return self.variant.size if self.variant else None

    @property
    def color(self) -> str | None:
        return self.variant.color if self.variant else None

    @property
    def storage(self) -> str | None:
        return self.variant.storage if self.variant else None

    @property
    def attributes(self) -> list[dict[str, str]]:
        if not self.variant:
            return []

        return self.variant.attributes or []

    @property
    def stock(self) -> int:
        return self.variant.stock if self.variant else 0


class Favorite(BaseModel):
    __tablename__ = "favorites"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)

    product = relationship("Product")


class Coupon(BaseModel):
    __tablename__ = "coupons"

    code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    discount_percent: Mapped[int] = mapped_column(nullable=False)
    starts_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    @property
    def is_currently_active(self) -> bool:
        now = datetime.utcnow()
        return self.is_active and self.starts_at <= now <= self.ends_at

class Order(BaseModel):
    __tablename__ = "orders"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    total_amount: Mapped[float] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    payment_status: Mapped[str] = mapped_column(String(50), default="pending")
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    user = relationship("User")
    items = relationship("OrderItem", backref="order")

    @property
    def customer_name(self) -> str | None:
        return self.user.full_name if self.user else None

    @property
    def customer_email(self) -> str | None:
        return self.user.email if self.user else None

    @property
    def customer_phone(self) -> str | None:
        return self.user.phone if self.user else None

class OrderItem(BaseModel):
    __tablename__ = "order_items"

    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    variant_id: Mapped[int] = mapped_column(ForeignKey("product_variants.id"))

    quantity: Mapped[int]
    price: Mapped[float]

    variant = relationship("ProductVariant")

    @property
    def product(self) -> Product | None:
        return self.variant.product if self.variant else None

    @property
    def product_uuid(self) -> str | None:
        return self.product.uuid if self.product else None

    @property
    def product_title(self) -> str | None:
        return self.product.title if self.product else None

    @property
    def product_image_url(self) -> str | None:
        return self.product.image_url if self.product else None

    @property
    def category_name(self) -> str | None:
        return self.product.category_name if self.product else None

    @property
    def size(self) -> str | None:
        return self.variant.size if self.variant else None

    @property
    def color(self) -> str | None:
        return self.variant.color if self.variant else None

    @property
    def storage(self) -> str | None:
        return self.variant.storage if self.variant else None

    @property
    def attributes(self) -> list[dict[str, str]]:
        if not self.variant:
            return []

        return self.variant.attributes or []

    @property
    def seller_id(self) -> int | None:
        return self.product.seller_id if self.product else None
