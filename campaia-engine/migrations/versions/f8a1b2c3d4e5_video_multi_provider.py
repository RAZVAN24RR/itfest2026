"""video_generations: multi-AI provider fields

Revision ID: f8a1b2c3d4e5
Revises: ae6521012c1e
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "f8a1b2c3d4e5"
down_revision: Union[str, None] = "ae6521012c1e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "video_generations",
        sa.Column("video_provider", sa.String(32), server_default="KLING", nullable=False),
    )
    op.add_column("video_generations", sa.Column("provider_used", sa.String(32), nullable=True))
    op.add_column(
        "video_generations",
        sa.Column("fallback_used", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column(
        "video_generations",
        sa.Column("aspect_ratio", sa.String(16), server_default="9:16", nullable=False),
    )
    op.add_column("video_generations", sa.Column("generation_duration_ms", sa.Integer(), nullable=True))
    op.execute("UPDATE video_generations SET provider_used = video_provider WHERE provider_used IS NULL")


def downgrade() -> None:
    op.drop_column("video_generations", "generation_duration_ms")
    op.drop_column("video_generations", "aspect_ratio")
    op.drop_column("video_generations", "fallback_used")
    op.drop_column("video_generations", "provider_used")
    op.drop_column("video_generations", "video_provider")
