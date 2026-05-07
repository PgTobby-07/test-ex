from app.domain.dashboard.repository import DashboardRepository
from app.domain.dashboard.schema import (
    AdminDashboardStatsRead,
    SellerCustomerRead,
    SellerDashboardStatsRead,
)
from app.domain.user.model import UserRole


class DashboardService:
    def __init__(self, repo: DashboardRepository):
        self.repo = repo

    async def get_seller_dashboard(self, seller_id: int):
        categories = await self.repo.get_categories()
        products = await self.repo.get_seller_products(seller_id)
        seller_orders = await self.repo.get_seller_orders(seller_id)

        customers_by_uuid: dict[str, SellerCustomerRead] = {}
        normalized_orders = []
        total_revenue = 0.0
        pending_order_count = 0

        for order in seller_orders:
            seller_items = [item for item in order.items if item.seller_id == seller_id]

            if not seller_items:
                continue

            seller_total = float(sum(item.price * item.quantity for item in seller_items))
            total_revenue += seller_total

            if order.status == "pending":
                pending_order_count += 1

            if order.user:
                existing_customer = customers_by_uuid.get(order.user.uuid)

                if not existing_customer:
                    customers_by_uuid[order.user.uuid] = SellerCustomerRead(
                        uuid=order.user.uuid,
                        full_name=order.user.full_name,
                        email=order.user.email,
                        phone=order.user.phone,
                        order_count=1,
                        total_spent=seller_total,
                        last_order_at=order.created_at,
                    )
                else:
                    existing_customer.order_count += 1
                    existing_customer.total_spent += seller_total
                    if order.created_at and (
                        existing_customer.last_order_at is None
                        or order.created_at > existing_customer.last_order_at
                    ):
                        existing_customer.last_order_at = order.created_at

            normalized_orders.append(
                {
                    "uuid": order.uuid,
                    "total_amount": seller_total,
                    "status": order.status,
                    "payment_status": order.payment_status,
                    "created_at": order.created_at,
                    "customer_name": order.customer_name,
                    "customer_email": order.customer_email,
                    "customer_phone": order.customer_phone,
                    "items": seller_items,
                }
            )

        customers = sorted(
            customers_by_uuid.values(),
            key=lambda customer: customer.last_order_at.timestamp() if customer.last_order_at else 0,
            reverse=True,
        )

        return {
            "stats": SellerDashboardStatsRead(
                product_count=len(products),
                order_count=len(normalized_orders),
                pending_order_count=pending_order_count,
                customer_count=len(customers),
                total_revenue=round(total_revenue, 2),
            ),
            "categories": categories,
            "products": products,
            "orders": normalized_orders,
            "customers": customers,
        }

    async def get_admin_dashboard(self):
        categories = await self.repo.get_categories()
        recent_users = await self.repo.get_recent_users()
        recent_products = await self.repo.get_recent_products()
        recent_orders = await self.repo.get_recent_orders()

        return {
            "stats": AdminDashboardStatsRead(
                user_count=await self.repo.count_users(),
                seller_count=await self.repo.count_users_by_role(UserRole.seller),
                customer_count=await self.repo.count_users_by_role(UserRole.customer),
                product_count=await self.repo.count_products(),
                order_count=await self.repo.count_orders(),
                pending_order_count=await self.repo.count_pending_orders(),
                total_revenue=await self.repo.total_revenue(),
            ),
            "categories": categories,
            "recent_users": recent_users,
            "recent_products": recent_products,
            "recent_orders": recent_orders,
        }
