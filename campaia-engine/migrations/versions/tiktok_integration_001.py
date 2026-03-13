"""add tiktok adgroup id and video url fields

Revision ID: tiktok_integration_001
Revises: 27d51559530c
Create Date: 2026-01-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'tiktok_integration_001'
down_revision: Union[str, None] = '27d51559530c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add TikTok integration fields to campaigns table."""
    # Add tiktok_adgroup_id column
    op.add_column(
        'campaigns',
        sa.Column('tiktok_adgroup_id', sa.String(100), nullable=True)
    )
    
    # Add video_url column for TikTok publishing
    op.add_column(
        'campaigns',
        sa.Column('video_url', sa.String(1000), nullable=True)
    )


def downgrade() -> None:
    """Remove TikTok integration fields."""
    op.drop_column('campaigns', 'video_url')
    op.drop_column('campaigns', 'tiktok_adgroup_id')
