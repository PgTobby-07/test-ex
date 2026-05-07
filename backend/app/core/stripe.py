import stripe
from app.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


def create_payment_intent(amount: int, currency: str = "usd"):
    if amount <= 0:
        raise ValueError("Payment amount must be greater than zero")

    intent = stripe.PaymentIntent.create(
        amount=amount,
        currency=currency,
        payment_method_types=["card"],
    )
    return intent
