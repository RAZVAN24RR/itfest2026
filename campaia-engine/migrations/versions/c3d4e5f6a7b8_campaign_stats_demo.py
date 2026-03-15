"""add demo TikTok-style stats on campaigns

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-03-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("campaigns", sa.Column("stats_impressions", sa.Integer(), nullable=True))
    op.add_column("campaigns", sa.Column("stats_clicks", sa.Integer(), nullable=True))
    op.add_column("campaigns", sa.Column("stats_shares", sa.Integer(), nullable=True))
    op.add_column("campaigns", sa.Column("stats_spend_ron", sa.Numeric(10, 2), nullable=True))


def downgrade() -> None:
    op.drop_column("campaigns", "stats_spend_ron")
    op.drop_column("campaigns", "stats_shares")
    op.drop_column("campaigns", "stats_clicks")
    op.drop_column("campaigns", "stats_impressions")
