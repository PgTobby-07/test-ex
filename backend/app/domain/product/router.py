from collections import defaultdict
import mimetypes

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.domain.product.repository import ProductRepository
from app.domain.product.service import ProductService
from app.domain.product.schema import (
    ProductCreate,
    ProductRead,
    ProductUpdate,
    CategoryCreate,
    CategoryRead,
    HomeFeedRead,
    ProductFilterOptionsRead,
    ProductListRead,
)

from fastapi import UploadFile, File

from app.domain.product.schema import VariantCreate, VariantRead


router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/categories", response_model=CategoryRead)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin", "superadmin")),
):
    repo = ProductRepository(db)
    service = ProductService(repo)

    return await service.create_category(data)


@router.get("/categories", response_model=list[CategoryRead])
async def list_categories(
    db: AsyncSession = Depends(get_db),
):
    repo = ProductRepository(db)
    service = ProductService(repo)

    return await service.list_categories()


@router.get("/categories/{slug}", response_model=CategoryRead)
async def get_category(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    repo = ProductRepository(db)
    service = ProductService(repo)

    return await service.get_category_by_slug(slug)


@router.get("/home", response_model=HomeFeedRead)
async def get_home_feed(
    db: AsyncSession = Depends(get_db),
):
    repo = ProductRepository(db)
    service = ProductService(repo)

    return await service.get_home_feed()


@router.get("/filter-options", response_model=ProductFilterOptionsRead)
async def get_filter_options(
    category_slug: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    repo = ProductRepository(db)
    service = ProductService(repo)

    return await service.get_filter_options(category_slug=category_slug)


@router.post("/", response_model=ProductRead)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("seller", "admin", "superadmin")),
):
    repo = ProductRepository(db)
    service = ProductService(repo)

    return await service.create_product(data, seller_id=current_user.id)


@router.get("/", response_model=ProductListRead)
async def list_products(
    search: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    category_slug: str | None = None,
    attributes: list[str] | None = Query(default=None),
    sizes: str | None = None,
    colors: str | None = None,
    storages: str | None = None,
    in_stock: bool | None = None,
    page: int = 1,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    repo = ProductRepository(db)
    service = ProductService(repo)

    attribute_filters: dict[str, list[str]] | None = None
    if attributes:
        grouped_filters: dict[str, list[str]] = defaultdict(list)
        for raw_attribute in attributes:
            key, separator, value = raw_attribute.partition("::")
            normalized_key = key.strip()
            normalized_value = value.strip() if separator else ""
            if normalized_key and normalized_value:
                grouped_filters[normalized_key].append(normalized_value)
        attribute_filters = dict(grouped_filters) if grouped_filters else None

    return await service.list_products(
        search,
        min_price,
        max_price,
        category_slug,
        attribute_filters,
        sizes.split(",") if sizes else None,
        colors.split(",") if colors else None,
        storages.split(",") if storages else None,
        in_stock,
        page,
        limit,
    )

@router.get("/{product_uuid}", response_model=ProductRead)
async def get_product_detail(
    product_uuid: str,
    db: AsyncSession = Depends(get_db),
):
    repo = ProductRepository(db)
    service = ProductService(repo)

    return await service.get_product_detail(product_uuid)


@router.get("/{product_uuid}/image")
async def get_product_image(
    product_uuid: str,
    db: AsyncSession = Depends(get_db),
):
    repo = ProductRepository(db)
    service = ProductService(repo)
    product = await service.get_product_detail(product_uuid)

    if not product.image_data or not product.image_content_type:
        raise HTTPException(status_code=404, detail="Product image not found")

    return Response(content=product.image_data, media_type=product.image_content_type)

@router.patch("/{product_uuid}", response_model=ProductRead)
async def update_product(
    product_uuid: str,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("seller", "admin", "superadmin")),
):
    repo = ProductRepository(db)
    service = ProductService(repo)

    return await service.update_product(
        product_uuid,
        data,
        seller_id=current_user.id,
    )

@router.delete("/{product_uuid}")
async def delete_product(
    product_uuid: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("seller", "admin", "superadmin")),
):
    repo = ProductRepository(db)
    service = ProductService(repo)

    return await service.delete_product(
        product_uuid,
        seller_id=current_user.id,
    )

@router.post("/{product_uuid}/variants", response_model=VariantRead)
async def add_variant(
    product_uuid: str,
    data: VariantCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("seller", "admin", "superadmin")),
):
    repo = ProductRepository(db)
    service = ProductService(repo)

    return await service.add_variant(
        product_uuid,
        data,
        seller_id=current_user.id,
    )

@router.post("/{product_uuid}/upload-image")
async def upload_product_image(
    product_uuid: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("seller", "admin", "superadmin")),
):
    repo = ProductRepository(db)
    service = ProductService(repo)

    product = await service.get_product_detail(product_uuid)

    if product.seller_id != current_user.id and current_user.role.value not in {"admin", "superadmin"}:
        raise HTTPException(status_code=403, detail="Not allowed")

    detected_content_type = (file.content_type or "").lower().strip()
    if not detected_content_type:
        detected_content_type = mimetypes.guess_type(file.filename or "")[0] or ""

    if not detected_content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    product.image_data = await file.read()
    product.image_content_type = detected_content_type
    product.image_url = f"/products/{product_uuid}/image"
    await repo.update_product(product)

    return {"image_url": product.image_url}
