from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.domain.product.model import Cart, Favorite, Order, Product
from app.domain.product.repository import ProductRepository
from app.domain.product.schema import CategoryCreate, CategoryRead
from app.domain.user.model import User
from app.domain.user.repository import UserRepository
from app.domain.user.schema import UserRead

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=list[UserRead])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.get("/orders")
async def get_all_orders(
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    result = await db.execute(select(Order).order_by(Order.created_at.desc()))
    return result.scalars().all()


@router.post("/categories", response_model=CategoryRead)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    repo = ProductRepository(db)

    existing_slug = await repo.get_category_by_slug(data.slug)
    if existing_slug:
        raise HTTPException(status_code=400, detail="Category slug already exists")

    if data.parent_id is not None:
        parent = await repo.get_category_by_id(data.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent category not found")

    from app.domain.product.model import Category

    category = Category(name=data.name, slug=data.slug, parent_id=data.parent_id)
    return await repo.create_category(category)


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    repo = ProductRepository(db)
    category = await repo.get_category_by_id(category_id)

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    product_count = await db.execute(
        select(func.count(Product.id)).where(Product.category_id == category.id)
    )
    if (product_count.scalar_one() or 0) > 0:
        raise HTTPException(status_code=400, detail="Delete category products first")

    await repo.delete_category(category)
    return {"message": "Category deleted"}


@router.delete("/products/{product_uuid}")
async def delete_product(
    product_uuid: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    repo = ProductRepository(db)
    product = await repo.get_by_uuid(product_uuid)

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if await repo.product_has_order_history(product.id):
        raise HTTPException(
            status_code=400,
            detail="Product has existing orders and cannot be deleted.",
        )

    await repo.cleanup_product_dependencies(product.id)
    await repo.delete_product(product)
    return {"message": "Product deleted"}


@router.patch("/users/{user_uuid}/deactivate", response_model=UserRead)
async def deactivate_user(
    user_uuid: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    repo = UserRepository(db)
    user = await repo.get_by_uuid(user_uuid)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.uuid == admin.uuid:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

    user.is_active = False
    return await repo.save(user)


@router.delete("/users/{user_uuid}")
async def delete_user(
    user_uuid: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    repo = UserRepository(db)
    user = await repo.get_by_uuid(user_uuid)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.uuid == admin.uuid:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    product_count = await db.execute(select(func.count(Product.id)).where(Product.seller_id == user.id))
    order_count = await db.execute(select(func.count(Order.id)).where(Order.user_id == user.id))
    cart_count = await db.execute(select(func.count(Cart.id)).where(Cart.user_id == user.id))
    favorite_count = await db.execute(select(func.count(Favorite.id)).where(Favorite.user_id == user.id))

    if any(
        count.scalar_one() or 0
        for count in [product_count, order_count, cart_count, favorite_count]
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has related records. Deactivate the user instead.",
        )

    await repo.delete(user)
    return {"message": "User deleted"}
