"""
Campaia Engine - Campaign Repository

Data access layer for campaign operations.
"""

import uuid
from typing import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.campaign import Campaign, CampaignStatus


class CampaignRepository:
    """Repository for campaign CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, campaign: Campaign) -> Campaign:
        """Create a new campaign."""
        self.db.add(campaign)
        await self.db.commit()
        await self.db.refresh(campaign)
        return campaign

    async def get_by_id(self, campaign_id: uuid.UUID) -> Campaign | None:
        """Get a campaign by ID."""
        result = await self.db.execute(
            select(Campaign).where(Campaign.id == campaign_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id_and_user(
        self, campaign_id: uuid.UUID, user_id: uuid.UUID
    ) -> Campaign | None:
        """Get a campaign by ID, ensuring it belongs to the user."""
        result = await self.db.execute(
            select(Campaign).where(
                Campaign.id == campaign_id,
                Campaign.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_user_campaigns(
        self,
        user_id: uuid.UUID,
        *,
        status: CampaignStatus | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[Sequence[Campaign], int]:
        """
        Get paginated campaigns for a user.
        
        Returns:
            Tuple of (campaigns, total_count)
        """
        # Base query
        query = select(Campaign).where(Campaign.user_id == user_id)
        count_query = select(func.count()).select_from(Campaign).where(
            Campaign.user_id == user_id
        )

        # Filter by status if provided
        if status:
            query = query.where(Campaign.status == status.value)
            count_query = count_query.where(Campaign.status == status.value)

        # Order by most recent first
        query = query.order_by(Campaign.created_at.desc())

        # Pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)

        # Execute queries
        result = await self.db.execute(query)
        campaigns = result.scalars().all()

        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        return campaigns, total

    async def update(self, campaign: Campaign) -> Campaign:
        """Update an existing campaign."""
        await self.db.commit()
        await self.db.refresh(campaign)
        return campaign

    async def delete(self, campaign: Campaign) -> None:
        """Delete a campaign."""
        await self.db.delete(campaign)
        await self.db.commit()

    async def update_status(
        self, campaign: Campaign, status: CampaignStatus
    ) -> Campaign:
        """Update campaign status."""
        campaign.status = status.value
        await self.db.commit()
        await self.db.refresh(campaign)
        return campaign

    async def add_tokens_spent(self, campaign: Campaign, tokens: int) -> Campaign:
        """Add tokens spent to campaign total."""
        campaign.tokens_spent += tokens
        await self.db.commit()
        await self.db.refresh(campaign)
        return campaign

