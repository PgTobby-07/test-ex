import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import select

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

load_dotenv(ROOT_DIR / ".env")

from app.core.security import hash_password
from app.database import AsyncSessionLocal, engine
from app.domain.product.model import Category, Product, ProductVariant
from app.domain.user.model import User, UserRole


CATEGORIES = [
    {"name": "Electronics", "slug": "electronics"},
    {"name": "Home Living", "slug": "home-living"},
    {"name": "Fashion", "slug": "fashion"},
    {"name": "Sport Outdoor", "slug": "sport-outdoor"},
]

PRODUCTS = [
    {
        "title": "Noise Canceling Headphones",
        "description": "Wireless over-ear headphones with soft cushions and deep everyday sound.",
        "price": 249,
        "category_slug": "electronics",
        "image_url": "/catalog/noise-canceling-headphones.svg",
        "variant": {"color": "Black", "storage": None, "size": None, "stock": 14},
    },
    {
        "title": "Smart Home Speaker",
        "description": "Compact voice assistant speaker designed for music, timers, and connected rooms.",
        "price": 139,
        "category_slug": "electronics",
        "image_url": "/catalog/smart-home-speaker.svg",
        "variant": {"color": "White", "storage": "128GB", "size": None, "stock": 11},
    },
    {
        "title": "Minimal Table Lamp",
        "description": "Warm ambient lamp with a modern silhouette for desks, bedrooms, and lounges.",
        "price": 89,
        "category_slug": "home-living",
        "image_url": "/catalog/minimal-table-lamp.svg",
        "variant": {"color": "Sand", "storage": None, "size": None, "stock": 18},
    },
    {
        "title": "Stoneware Dinner Set",
        "description": "Durable matte-finish dinnerware set built for daily hosting and family meals.",
        "price": 119,
        "category_slug": "home-living",
        "image_url": "/catalog/stoneware-dinner-set.svg",
        "variant": {"color": "Clay", "storage": None, "size": "12 pcs", "stock": 9},
    },
    {
        "title": "Classic Linen Shirt",
        "description": "Breathable relaxed-fit linen shirt styled for daily wear and casual evenings.",
        "price": 74,
        "category_slug": "fashion",
        "image_url": "/catalog/classic-linen-shirt.svg",
        "variant": {"color": "Blue", "storage": None, "size": "L", "stock": 16},
    },
    {
        "title": "Runner Street Sneakers",
        "description": "Comfort-first sneakers with lightweight cushioning and a clean streetwear profile.",
        "price": 129,
        "category_slug": "fashion",
        "image_url": "/catalog/runner-street-sneakers.svg",
        "variant": {"color": "White", "storage": None, "size": "42", "stock": 12},
    },
    {
        "title": "Trail Hydration Backpack",
        "description": "Outdoor performance backpack with hydration storage and quick-access utility pockets.",
        "price": 156,
        "category_slug": "sport-outdoor",
        "image_url": "/catalog/trail-hydration-backpack.svg",
        "variant": {"color": "Forest", "storage": "20L", "size": None, "stock": 7},
    },
    {
        "title": "Carbon Yoga Mat",
        "description": "High-grip training mat with stable cushioning for stretching, yoga, and floor work.",
        "price": 59,
        "category_slug": "sport-outdoor",
        "image_url": "/catalog/carbon-yoga-mat.svg",
        "variant": {"color": "Graphite", "storage": None, "size": "Standard", "stock": 20},
    },
]


async def get_or_create_seller(session):
    result = await session.execute(
        select(User).where(User.email == "seller-demo@ewp.local")
    )
    seller = result.scalar_one_or_none()

    if seller:
        return seller

    seller = User(
        email="seller-demo@ewp.local",
        password_hash=hash_password("SellerDemo123"),
        role=UserRole.seller,
        is_active=True,
        full_name="Demo Seller",
        phone="+1-555-0101",
    )
    session.add(seller)
    await session.flush()
    return seller


async def seed():
    async with AsyncSessionLocal() as session:
        seller = await get_or_create_seller(session)

        category_by_slug: dict[str, Category] = {}

        for item in CATEGORIES:
            result = await session.execute(
                select(Category).where(Category.slug == item["slug"])
            )
            category = result.scalar_one_or_none()

            if category is None:
                category = Category(name=item["name"], slug=item["slug"])
                session.add(category)
                await session.flush()

            category_by_slug[category.slug] = category

        for item in PRODUCTS:
            result = await session.execute(
                select(Product).where(Product.title == item["title"])
            )
            product = result.scalar_one_or_none()
            category = category_by_slug[item["category_slug"]]

            if product is None:
                product = Product(
                    title=item["title"],
                    description=item["description"],
                    image_url=item["image_url"],
                    price=item["price"],
                    seller_id=seller.id,
                    category_id=category.id,
                )
                session.add(product)
                await session.flush()
            else:
                product.description = item["description"]
                product.image_url = item["image_url"]
                product.price = item["price"]
                product.category_id = category.id

            variant_result = await session.execute(
                select(ProductVariant).where(ProductVariant.product_id == product.id)
            )
            variant = variant_result.scalar_one_or_none()

            if variant is None:
                variant = ProductVariant(
                    product_id=product.id,
                    sku=f"SKU-{product.id}-DEFAULT",
                )
                session.add(variant)

            variant.price = item["price"]
            variant.stock = item["variant"]["stock"]
            variant.size = item["variant"]["size"]
            variant.color = item["variant"]["color"]
            variant.storage = item["variant"]["storage"]

        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())
    asyncio.run(engine.dispose())
