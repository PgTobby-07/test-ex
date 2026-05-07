"""expand product image blob and safe delete helpers

Revision ID: 3c4a9b6e2f11
Revises: 1a2d9f7c4b10
Create Date: 2026-04-28 18:05:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


# revision identifiers, used by Alembic.
revision: str = "3c4a9b6e2f11"
down_revision: Union[str, Sequence[str], None] = "1a2d9f7c4b10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    if dialect_name == "mysql":
        op.alter_column(
            "products",
            "image_data",
            existing_type=sa.LargeBinary(),
            type_=mysql.MEDIUMBLOB(),
            existing_nullable=True,
        )


def downgrade() -> None:
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    if dialect_name == "mysql":
        op.alter_column(
            "products",
            "image_data",
            existing_type=mysql.MEDIUMBLOB(),
            type_=sa.LargeBinary(),
            existing_nullable=True,
        )
