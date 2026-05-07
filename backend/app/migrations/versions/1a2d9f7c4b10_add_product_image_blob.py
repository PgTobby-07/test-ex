"""add product image blob

Revision ID: 1a2d9f7c4b10
Revises: 6b9d0f4b2c11
Create Date: 2026-04-28 18:20:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "1a2d9f7c4b10"
down_revision: str | None = "6b9d0f4b2c11"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("products", sa.Column("image_data", sa.LargeBinary(), nullable=True))
    op.add_column("products", sa.Column("image_content_type", sa.String(length=120), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "image_content_type")
    op.drop_column("products", "image_data")
