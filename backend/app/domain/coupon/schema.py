from datetime import datetime

from pydantic import BaseModel


class CouponRead(BaseModel):
    code: str
    title: str
    description: str | None
    discount_percent: int
    starts_at: datetime
    ends_at: datetime

    model_config = {"from_attributes": True}
