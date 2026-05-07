from collections import Counter
import re

from app.domain.product.model import Category, Product
from app.domain.product.repository import ProductRepository
from app.domain.product.schema import CategoryCreate, HomeFeedSection, ProductCreate
from fastapi import HTTPException, status
from app.domain.product.model import ProductVariant

class ProductService:
    def __init__(self, repo: ProductRepository):
        self.repo = repo

    @staticmethod
    def _normalize_attributes(attributes) -> list[dict[str, str]]:
        cleaned_attributes: list[dict[str, str]] = []

        for attribute in attributes or []:
            key = getattr(attribute, "key", "") if not isinstance(attribute, dict) else attribute.get("key", "")
            value = getattr(attribute, "value", "") if not isinstance(attribute, dict) else attribute.get("value", "")
            normalized_key = str(key).strip()
            normalized_value = str(value).strip()

            if not normalized_key or not normalized_value:
                continue

            cleaned_attributes.append(
                {
                    "key": normalized_key,
                    "value": normalized_value,
                }
            )

        return cleaned_attributes

    @staticmethod
    def _extract_legacy_attribute_values(attributes: list[dict[str, str]]) -> tuple[str | None, str | None, str | None]:
        normalized_map = {
            attribute["key"].strip().lower(): attribute["value"].strip()
            for attribute in attributes
            if attribute.get("key") and attribute.get("value")
        }
        return (
            normalized_map.get("size"),
            normalized_map.get("color"),
            normalized_map.get("storage"),
        )

    @staticmethod
    def _build_sku(product: Product, variant_index: int) -> str:
        base_slug = re.sub(r"[^A-Z0-9]+", "-", product.title.upper()).strip("-") or "PRODUCT"
        compact_slug = base_slug[:24]
        return f"{compact_slug}-{product.id:05d}-{variant_index:02d}"

    async def create_category(self, data: CategoryCreate):
        category = Category(
            name=data.name,
            slug=data.slug,
            parent_id=data.parent_id,
        )
        return await self.repo.create_category(category)

    async def list_categories(self):
        return await self.repo.get_categories()

    async def get_category_by_slug(self, slug: str):
        category = await self.repo.get_category_by_slug(slug)

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

        return category

    async def get_filter_options(self, category_slug: str | None = None):
        return await self.repo.get_filter_options(category_slug=category_slug)

    async def get_home_feed(self):
        categories = await self.repo.get_categories()
        latest_items = await self.repo.get_latest_products()
        popular_items = await self.repo.get_products_by_sales()
        most_used_items = await self.repo.get_products_by_cart_usage()
        offers = await self.repo.get_offer_products()

        fallback_pool = latest_items or offers

        if not popular_items:
            popular_items = fallback_pool[:8]

        if not most_used_items:
            most_used_items = fallback_pool[:8]

        category_counter = Counter(
            product.category_id
            for product in [*latest_items, *popular_items, *most_used_items]
            if product.category_id is not None
        )

        related_items: list[Product] = []
        related_category_name = "Curated for you"

        if category_counter:
            related_category_id, _ = category_counter.most_common(1)[0]
            related_items = await self.repo.get_related_products(
                category_id=related_category_id,
                exclude_product_ids=[product.id for product in latest_items[:4]],
            )
            matched_category = next(
                (category for category in categories if category.id == related_category_id),
                None,
            )
            if matched_category:
                related_category_name = matched_category.name

        if not related_items:
            related_items = fallback_pool[:8]

        return {
            "latest_items": HomeFeedSection(
                title="Latest Added",
                subtitle="Fresh arrivals added to your marketplace most recently.",
                items=latest_items,
            ),
            "popular_items": HomeFeedSection(
                title="Popular Items",
                subtitle="Products customers are already ordering the most.",
                items=popular_items,
            ),
            "most_used_items": HomeFeedSection(
                title="Most Used Items",
                subtitle="Products shoppers keep adding to carts again and again.",
                items=most_used_items,
            ),
            "offers": HomeFeedSection(
                title="Offers",
                subtitle="The strongest value picks based on the lowest live prices.",
                items=offers,
            ),
            "related_items": HomeFeedSection(
                title=f"Related Items",
                subtitle=f"More products from {related_category_name}.",
                items=related_items,
            ),
            "categories": categories[:10],
        }

    async def create_product(self, data: ProductCreate, seller_id: int):
        product = Product(
            title=data.title,
            description=data.description,
            image_url=data.image_url,
            price=data.price,
            category_id=data.category_id,
            seller_id=seller_id,
        )
        product = await self.repo.create_product(product)

        variants = data.variants or [
            ProductVariant(
                product_id=product.id,
                sku=self._build_sku(product, 1),
                price=product.price,
                stock=10,
                attributes=[],
            )
        ]

        if data.variants:
            variants = []
            for index, variant in enumerate(data.variants, start=1):
                attributes = self._normalize_attributes(variant.attributes)
                size, color, storage = self._extract_legacy_attribute_values(attributes)
                variants.append(
                    ProductVariant(
                        product_id=product.id,
                        sku=self._build_sku(product, index),
                        attributes=attributes,
                        size=size,
                        color=color,
                        storage=storage,
                        price=variant.price,
                        stock=variant.stock,
                    )
                )

        for variant in variants:
            await self.repo.create_variant(variant)

        return await self.repo.get_by_uuid(product.uuid)

    async def list_products(
        self,
        search: str | None,
        min_price: float | None,
        max_price: float | None,
        category_slug: str | None,
        attribute_filters: dict[str, list[str]] | None,
        sizes: list[str] | None,
        colors: list[str] | None,
        storages: list[str] | None,
        in_stock: bool | None,
        page: int,
        limit: int,
    ):
        return await self.repo.get_products(
            search=search,
            min_price=min_price,
            max_price=max_price,
            category_slug=category_slug,
            attribute_filters=attribute_filters,
            sizes=sizes,
            colors=colors,
            storages=storages,
            in_stock=in_stock,
            page=page,
            limit=limit,
        )
    
    async def get_product_detail(self, product_uuid: str):
        product = await self.repo.get_by_uuid(product_uuid)

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        return product
    
    async def update_product(self, product_uuid: str, data, seller_id: int):
        product = await self.get_product_detail(product_uuid)

        if product.seller_id != seller_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this product",
            )

        if data.title is not None:
            product.title = data.title

        if data.description is not None:
            product.description = data.description

        if data.image_url is not None:
            product.image_url = data.image_url

        if data.price is not None:
            product.price = data.price

        if data.category_id is not None:
            product.category_id = data.category_id

        return await self.repo.update_product(product)


    async def delete_product(self, product_uuid: str, seller_id: int):
        product = await self.get_product_detail(product_uuid)

        if product.seller_id != seller_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this product",
            )

        if await self.repo.product_has_order_history(product.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product has existing orders and cannot be deleted.",
            )

        await self.repo.cleanup_product_dependencies(product.id)

        await self.repo.delete_product(product)

        return {"message": "Product deleted successfully"}
    
    async def add_variant(
        self,
        product_uuid: str,
        data,
        seller_id: int,
    ):
        product = await self.get_product_detail(product_uuid)

        if product.seller_id != seller_id:
            raise HTTPException(
                status_code=403,
                detail="You do not own this product",
            )

        variant = ProductVariant(
            product_id=product.id,
            sku=self._build_sku(product, len(product.variants) + 1),
            attributes=self._normalize_attributes(data.attributes),
            price=data.price,
            stock=data.stock,
        )
        variant.size, variant.color, variant.storage = self._extract_legacy_attribute_values(variant.attributes)

        return await self.repo.create_variant(variant)
