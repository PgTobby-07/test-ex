"""add coupons and cart coupon

Revision ID: e31c12c1c0de
Revises: f2b6c1e4c712
Create Date: 2026-04-27 16:10:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e31c12c1c0de"
down_revision: str | None = "f2b6c1e4c712"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "coupons",
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("discount_percent", sa.Integer(), nullable=False),
        sa.Column("starts_at", sa.DateTime(), nullable=False),
        sa.Column("ends_at", sa.DateTime(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("uuid", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_coupons_code"), "coupons", ["code"], unique=True)
    op.create_index(op.f("ix_coupons_id"), "coupons", ["id"], unique=False)
    op.create_index(op.f("ix_coupons_uuid"), "coupons", ["uuid"], unique=True)

    op.add_column("carts", sa.Column("applied_coupon_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_carts_applied_coupon_id_coupons",
        "carts",
        "coupons",
        ["applied_coupon_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_carts_applied_coupon_id_coupons", "carts", type_="foreignkey")
    op.drop_column("carts", "applied_coupon_id")
    op.drop_index(op.f("ix_coupons_uuid"), table_name="coupons")
    op.drop_index(op.f("ix_coupons_id"), table_name="coupons")
    op.drop_index(op.f("ix_coupons_code"), table_name="coupons")
    op.drop_table("coupons")
