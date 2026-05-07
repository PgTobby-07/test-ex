"""add variant attributes

Revision ID: 6b9d0f4b2c11
Revises: e31c12c1c0de
Create Date: 2026-04-28 16:55:00.000000
"""

from collections.abc import Sequence
import json

from alembic import op
import sqlalchemy as sa


revision: str = "6b9d0f4b2c11"
down_revision: str | None = "e31c12c1c0de"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    existing_columns = {column["name"] for column in inspector.get_columns("product_variants")}

    if "attributes" not in existing_columns:
        op.add_column(
            "product_variants",
            sa.Column("attributes", sa.JSON(), nullable=True),
        )

    variants = connection.execute(
        sa.text(
            """
            SELECT id, size, color, storage
            FROM product_variants
            """
        )
    ).mappings()

    for variant in variants:
        attributes: list[dict[str, str]] = []

        if variant["size"]:
            attributes.append({"key": "Size", "value": variant["size"]})
        if variant["color"]:
            attributes.append({"key": "Color", "value": variant["color"]})
        if variant["storage"]:
            attributes.append({"key": "Storage", "value": variant["storage"]})

        connection.execute(
            sa.text(
                """
                UPDATE product_variants
                SET attributes = :attributes
                WHERE id = :variant_id
                """
            ),
            {
                "variant_id": variant["id"],
                "attributes": json.dumps(attributes),
            },
        )

    connection.execute(
        sa.text(
            """
            UPDATE product_variants
            SET attributes = '[]'
            WHERE attributes IS NULL
            """
        )
    )

    refreshed_columns = {
        column["name"]: column
        for column in sa.inspect(connection).get_columns("product_variants")
    }
    if refreshed_columns.get("attributes", {}).get("nullable", True):
        op.alter_column(
            "product_variants",
            "attributes",
            existing_type=sa.JSON(),
            nullable=False,
        )


def downgrade() -> None:
    op.drop_column("product_variants", "attributes")
