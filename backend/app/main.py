from fastapi import FastAPI
from app.domain.user.router import router as user_router
from app.domain.product.router import router as product_router
from app.domain.cart.router import router as cart_router
from app.domain.order.router import router as order_router
from app.domain.favorite.router import router as favorite_router
from app.domain.payment.router import router as payment_router
from app.domain.dashboard.router import router as dashboard_router
from app.domain.coupon.router import router as coupon_router
from fastapi.staticfiles import StaticFiles
from app.domain.admin.router import router as admin_router

import os
from fastapi.staticfiles import StaticFiles

from sqlalchemy import text
from app.database import engine

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://localhost:3000",
        "https://ewp-seven.vercel.app",
        "https://ewp-production-c944.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "eWP backend is running 🚀"}

app.include_router(user_router)
app.include_router(product_router)
app.include_router(cart_router)
app.include_router(favorite_router)
app.include_router(order_router)
app.include_router(payment_router)
app.include_router(dashboard_router)
app.include_router(coupon_router)
app.include_router(admin_router)

@app.get("/debug-db")
async def debug_db():
    try:
        async with engine.begin() as conn:
            db_name = await conn.execute(text("SELECT DATABASE()"))
            tables = await conn.execute(text("SHOW TABLES"))

            return {
                "database": db_name.scalar(),
                "tables": [row[0] for row in tables.fetchall()],
            }
    except Exception as e:
        return {
            "error": str(e),
            "type": type(e).__name__,
        }
