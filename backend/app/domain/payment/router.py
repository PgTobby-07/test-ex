from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import stripe

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.domain.order.repository import OrderRepository

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/confirm/{payment_intent_id}")
async def confirm_payment(
    payment_intent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = OrderRepository(db)
    order = await repo.mark_order_paid(payment_intent_id)

    if not order:
        raise HTTPException(status_code=404, detail="Order not found for payment")

    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    await repo.clear_cart_by_user_id(order.user_id)
    return {"status": "success", "order_uuid": order.uuid}


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            settings.STRIPE_WEBHOOK_SECRET,
        )
    except Exception as e:
        print("WEBHOOK ERROR:", str(e))
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        payment_intent_id = payment_intent["id"]

        repo = OrderRepository(db)
        order = await repo.mark_order_paid(payment_intent_id)

        if order:
            await repo.clear_cart_by_user_id(order.user_id)

        print("🔥 PAYMENT SUCCESS:", payment_intent_id)

    return {"status": "success"}
