import asyncio
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import select

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

load_dotenv(ROOT_DIR / ".env")

from app.database import AsyncSessionLocal, engine
from app.domain.product.model import Product, ProductVariant


async def backfill():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Product))
        products = result.scalars().all()

        for product in products:
            variant_result = await session.execute(
                select(ProductVariant).where(ProductVariant.product_id == product.id)
            )

            if variant_result.scalar_one_or_none():
                continue

            session.add(
                ProductVariant(
                    product_id=product.id,
                    sku=f"SKU-{product.id}-DEFAULT",
                    price=product.price,
                    stock=10,
                )
            )

        await session.commit()


if __name__ == "__main__":
    asyncio.run(backfill())
    asyncio.run(engine.dispose())
