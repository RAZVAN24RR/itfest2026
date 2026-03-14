"""add campaign_schedules table

Revision ID: a1b2c3d4e5f6
Revises: f8a1b2c3d4e5
Create Date: 2026-03-14 20:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY

revision = "a1b2c3d4e5f6"
down_revision = "f8a1b2c3d4e5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "campaign_schedules",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("campaign_id", UUID(as_uuid=True), sa.ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, unique=True, index=True),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("days_of_week", ARRAY(sa.Integer), nullable=False, server_default="{0,1,2,3,4}"),
        sa.Column("start_time", sa.String(5), nullable=False, server_default="09:00"),
        sa.Column("end_time", sa.String(5), nullable=False, server_default="21:00"),
        sa.Column("timezone", sa.String(50), nullable=False, server_default="Europe/Bucharest"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("campaign_schedules")
