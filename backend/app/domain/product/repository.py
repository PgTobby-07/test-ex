from math import ceil

from collections import defaultdict

from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.product.model import CartItem, Category, Favorite, OrderItem, Product

from app.domain.product.model import ProductVariant

class ProductRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_category(self, category: Category):
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def get_categories(self):
        result = await self.db.execute(
            select(Category).order_by(Category.name.asc())
        )
        return result.scalars().all()

    async def get_category_by_slug(self, slug: str):
        result = await self.db.execute(
            select(Category).where(Category.slug == slug)
        )
        return result.scalar_one_or_none()

    async def get_category_by_id(self, category_id: int):
        result = await self.db.execute(
            select(Category).where(Category.id == category_id)
        )
        return result.scalar_one_or_none()

    async def get_latest_products(self, limit: int = 8):
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.category), selectinload(Product.variants))
            .order_by(Product.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def create_product(self, product: Product):
        self.db.add(product)
        await self.db.commit()
        await self.db.refresh(product)
        return product

    async def get_products(
        self,
        search: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        category_slug: str | None = None,
        attribute_filters: dict[str, list[str]] | None = None,
        sizes: list[str] | None = None,
        colors: list[str] | None = None,
        storages: list[str] | None = None,
        in_stock: bool | None = None,
        page: int = 1,
        limit: int = 10,
    ):
        query = select(Product)
        count_query = select(func.count(func.distinct(Product.id)))
        query = query.options(selectinload(Product.category), selectinload(Product.variants))
        joined_variants = False

        if search:
            query = query.where(Product.title.ilike(f"%{search}%"))
            count_query = count_query.where(Product.title.ilike(f"%{search}%"))

        if min_price is not None:
            query = query.where(Product.price >= min_price)
            count_query = count_query.where(Product.price >= min_price)

        if max_price is not None:
            query = query.where(Product.price <= max_price)
            count_query = count_query.where(Product.price <= max_price)

        if category_slug:
            query = query.join(Product.category).where(Category.slug == category_slug)
            count_query = count_query.join(Product.category).where(Category.slug == category_slug)

        if sizes or colors or storages or in_stock or attribute_filters:
            query = query.join(ProductVariant, ProductVariant.product_id == Product.id)
            count_query = count_query.join(ProductVariant, ProductVariant.product_id == Product.id)
            joined_variants = True

        if sizes:
            query = query.where(ProductVariant.size.in_(sizes))
            count_query = count_query.where(ProductVariant.size.in_(sizes))

        if colors:
            query = query.where(ProductVariant.color.in_(colors))
            count_query = count_query.where(ProductVariant.color.in_(colors))

        if storages:
            query = query.where(ProductVariant.storage.in_(storages))
            count_query = count_query.where(ProductVariant.storage.in_(storages))

        if attribute_filters:
            for key, values in attribute_filters.items():
                if not key or not values:
                    continue

                variant_match = or_(
                    *[
                        ProductVariant.attributes.contains([{"key": key, "value": value}])
                        for value in values
                    ]
                )
                query = query.where(variant_match)
                count_query = count_query.where(variant_match)

        if in_stock:
            query = query.where(ProductVariant.stock > 0)
            count_query = count_query.where(ProductVariant.stock > 0)

        if joined_variants:
            query = query.distinct()

        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one() or 0

        query = query.offset((page - 1) * limit).limit(limit)

        result = await self.db.execute(query)
        return {
            "items": result.scalars().all(),
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": ceil(total / limit) if limit > 0 and total > 0 else 0,
        }

    async def get_filter_options(self, category_slug: str | None = None):
        categories = await self.get_categories()
        category_filter = (
            select(Product.id).join(Product.category).where(Category.slug == category_slug)
            if category_slug
            else None
        )

        size_query = (
            select(ProductVariant.size)
            .join(Product, Product.id == ProductVariant.product_id)
            .where(ProductVariant.size.is_not(None))
        )
        color_query = (
            select(ProductVariant.color)
            .join(Product, Product.id == ProductVariant.product_id)
            .where(ProductVariant.color.is_not(None))
        )
        storage_query = (
            select(ProductVariant.storage)
            .join(Product, Product.id == ProductVariant.product_id)
            .where(ProductVariant.storage.is_not(None))
        )

        if category_filter is not None:
            size_query = size_query.where(Product.id.in_(category_filter))
            color_query = color_query.where(Product.id.in_(category_filter))
            storage_query = storage_query.where(Product.id.in_(category_filter))

        size_result = await self.db.execute(
            size_query.distinct().order_by(ProductVariant.size.asc())
        )
        color_result = await self.db.execute(
            color_query.distinct().order_by(ProductVariant.color.asc())
        )
        storage_result = await self.db.execute(
            storage_query.distinct().order_by(ProductVariant.storage.asc())
        )
        price_query = select(func.min(Product.price), func.max(Product.price))
        if category_slug:
            price_query = price_query.join(Product.category).where(Category.slug == category_slug)
        price_result = await self.db.execute(price_query)

        min_price, max_price = price_result.one()

        attribute_query = (
            select(ProductVariant.attributes)
            .join(Product, Product.id == ProductVariant.product_id)
        )
        if category_slug:
            attribute_query = attribute_query.join(Product.category).where(Category.slug == category_slug)

        attribute_result = await self.db.execute(attribute_query)
        facet_map: dict[str, set[str]] = defaultdict(set)
        for attributes in attribute_result.scalars().all():
            for attribute in attributes or []:
                key = str(attribute.get("key", "")).strip()
                value = str(attribute.get("value", "")).strip()
                if key and value:
                    facet_map[key].add(value)

        attribute_facets = [
            {
                "key": key,
                "values": sorted(values),
            }
            for key, values in sorted(facet_map.items(), key=lambda item: item[0].lower())
        ]

        return {
            "categories": categories,
            "attribute_facets": attribute_facets,
            "sizes": [value for value in size_result.scalars().all() if value],
            "colors": [value for value in color_result.scalars().all() if value],
            "storages": [value for value in storage_result.scalars().all() if value],
            "min_price": float(min_price) if min_price is not None else None,
            "max_price": float(max_price) if max_price is not None else None,
        }

    async def get_products_by_sales(self, limit: int = 8):
        sales_subquery = (
            select(
                ProductVariant.product_id.label("product_id"),
                func.coalesce(func.sum(OrderItem.quantity), 0).label("score"),
            )
            .join(OrderItem, OrderItem.variant_id == ProductVariant.id)
            .group_by(ProductVariant.product_id)
            .subquery()
        )

        result = await self.db.execute(
            select(Product)
            .join(sales_subquery, sales_subquery.c.product_id == Product.id)
            .options(selectinload(Product.category), selectinload(Product.variants))
            .order_by(sales_subquery.c.score.desc(), Product.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def get_products_by_cart_usage(self, limit: int = 8):
        usage_subquery = (
            select(
                ProductVariant.product_id.label("product_id"),
                func.coalesce(func.sum(CartItem.quantity), 0).label("score"),
            )
            .join(CartItem, CartItem.variant_id == ProductVariant.id)
            .group_by(ProductVariant.product_id)
            .subquery()
        )

        result = await self.db.execute(
            select(Product)
            .join(usage_subquery, usage_subquery.c.product_id == Product.id)
            .options(selectinload(Product.category), selectinload(Product.variants))
            .order_by(usage_subquery.c.score.desc(), Product.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def get_offer_products(self, limit: int = 8):
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.category), selectinload(Product.variants))
            .order_by(Product.price.asc(), Product.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def get_related_products(
        self,
        *,
        category_id: int,
        exclude_product_ids: list[int] | None = None,
        limit: int = 8,
    ):
        query = (
            select(Product)
            .options(selectinload(Product.category), selectinload(Product.variants))
            .where(Product.category_id == category_id)
            .order_by(Product.created_at.desc())
        )

        if exclude_product_ids:
            query = query.where(Product.id.not_in(exclude_product_ids))

        result = await self.db.execute(query.limit(limit))
        return result.scalars().all()
    
    async def get_by_uuid(self, product_uuid: str):
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.category), selectinload(Product.variants))
            .where(Product.uuid == product_uuid)
        )
        return result.scalar_one_or_none()
    
    async def update_product(self, product: Product):
        await self.db.commit()
        await self.db.refresh(product)
        return product

    async def delete_product(self, product: Product):
        await self.db.delete(product)
        await self.db.commit()

    async def product_has_order_history(self, product_id: int) -> bool:
        result = await self.db.execute(
            select(func.count(OrderItem.id))
            .join(ProductVariant, ProductVariant.id == OrderItem.variant_id)
            .where(ProductVariant.product_id == product_id)
        )
        return (result.scalar_one() or 0) > 0

    async def cleanup_product_dependencies(self, product_id: int):
        variant_ids_result = await self.db.execute(
            select(ProductVariant.id).where(ProductVariant.product_id == product_id)
        )
        variant_ids = list(variant_ids_result.scalars().all())

        await self.db.execute(delete(Favorite).where(Favorite.product_id == product_id))

        if variant_ids:
            await self.db.execute(delete(CartItem).where(CartItem.variant_id.in_(variant_ids)))
            await self.db.execute(delete(ProductVariant).where(ProductVariant.id.in_(variant_ids)))

        await self.db.commit()

    async def delete_category(self, category: Category):
        await self.db.delete(category)
        await self.db.commit()

    async def create_variant(self, variant: ProductVariant):
        self.db.add(variant)
        await self.db.commit()
        await self.db.refresh(variant)
        return variant

    async def get_product_with_variants(self, product_uuid: str):
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.category), selectinload(Product.variants))
            .where(Product.uuid == product_uuid)
        )
        return result.scalar_one_or_none()
