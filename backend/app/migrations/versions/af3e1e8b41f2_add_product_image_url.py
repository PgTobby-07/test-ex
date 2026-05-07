"""add product image url

Revision ID: af3e1e8b41f2
Revises: dc5e4d39fe4e
Create Date: 2026-04-27 03:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "af3e1e8b41f2"
down_revision: Union[str, Sequence[str], None] = "dc5e4d39fe4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("products", sa.Column("image_url", sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "image_url")
