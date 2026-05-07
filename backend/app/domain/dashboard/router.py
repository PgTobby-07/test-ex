from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_role
from app.domain.dashboard.repository import DashboardRepository
from app.domain.dashboard.schema import AdminDashboardRead, SellerDashboardRead
from app.domain.dashboard.service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/seller", response_model=SellerDashboardRead)
async def get_seller_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("seller", "admin", "superadmin")),
):
    repo = DashboardRepository(db)
    service = DashboardService(repo)
    return await service.get_seller_dashboard(current_user.id)


@router.get("/admin", response_model=AdminDashboardRead)
async def get_admin_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin", "superadmin")),
):
    repo = DashboardRepository(db)
    service = DashboardService(repo)
    return await service.get_admin_dashboard()
