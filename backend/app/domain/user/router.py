import os
import shutil

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domain.user.repository import UserRepository
from app.domain.user.service import UserService
from app.domain.user.schema import UserCreate, UserRead, UserLogin, TokenResponse, UserUpdate

from app.dependencies import get_current_user

from app.dependencies import require_role

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/register", response_model=UserRead)
async def register_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    service = UserService(repo)

    user = await service.register_user(data)
    return user

@router.post("/login", response_model=TokenResponse)
async def login_user(
    data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    service = UserService(repo)

    token = await service.login_user(data)

    return {
        "access_token": token,
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserRead)
async def get_me(current_user = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserRead)
async def update_me(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = UserRepository(db)
    service = UserService(repo)
    return await service.update_user(current_user, data)

@router.post("/me/avatar", response_model=UserRead)
async def upload_my_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    extension = os.path.splitext(file.filename or "")[1].lower()
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

    if extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    os.makedirs("uploads/avatars", exist_ok=True)
    file_name = f"{current_user.uuid}{extension}"
    file_path = os.path.join("uploads", "avatars", file_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    repo = UserRepository(db)
    service = UserService(repo)

    return await service.update_user(
        current_user,
        UserUpdate(avatar_url=f"/uploads/avatars/{file_name}"),
    )

@router.get("/admin-only")
async def admin_only(
    current_user = Depends(require_role("admin", "superadmin"))
):
    return {"message": "Welcome admin 🔥"}
