"""
Campaia Engine - Campaign Service

Business logic for campaign operations.
"""

import math
import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.campaign import Campaign, CampaignStatus
from app.models.user import User
from app.repositories.campaign_repo import CampaignRepository
from app.schemas.campaign import (
    CampaignCreate,
    CampaignListResponse,
    CampaignResponse,
    CampaignUpdate,
    CampaignMapMarker,
)


class CampaignNotFoundError(Exception):
    """Raised when a campaign is not found."""
    pass


class CampaignAccessDeniedError(Exception):
    """Raised when user doesn't have access to a campaign."""
    pass


class CampaignStatusError(Exception):
    """Raised when a campaign status transition is invalid."""
    pass


class CampaignService:
    """Service for campaign business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CampaignRepository(db)

    async def create_campaign(
        self, user: User, data: CampaignCreate
    ) -> CampaignResponse:
        """
        Create a new campaign for a user.
        
        Args:
            user: The user creating the campaign
            data: Campaign creation data
        
        Returns:
            Created campaign response
        """
        campaign = Campaign(
            user_id=user.id,
            name=data.name,
            url=data.url,
            budget=data.budget,
            duration=data.duration,
            product_desc=data.product_desc,
            lat=data.lat,
            lng=data.lng,
            city=data.city,
            status=CampaignStatus.DRAFT.value,
        )

        campaign = await self.repo.create(campaign)
        return CampaignResponse.model_validate(campaign)

    async def get_campaign(
        self, user: User, campaign_id: uuid.UUID
    ) -> CampaignResponse:
        """
        Get a campaign by ID for a user.
        
        Args:
            user: The requesting user
            campaign_id: Campaign ID
        
        Returns:
            Campaign response
        
        Raises:
            CampaignNotFoundError: If campaign doesn't exist or user doesn't have access
        """
        campaign = await self.repo.get_by_id_and_user(campaign_id, user.id)
        
        if not campaign:
            raise CampaignNotFoundError(f"Campaign {campaign_id} not found")
        
        return CampaignResponse.model_validate(campaign)

    async def list_campaigns(
        self,
        user: User,
        *,
        status: CampaignStatus | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> CampaignListResponse:
        """
        List campaigns for a user with pagination.
        
        Args:
            user: The requesting user
            status: Optional status filter
            page: Page number (1-indexed)
            per_page: Items per page
        
        Returns:
            Paginated campaign list
        """
        campaigns, total = await self.repo.get_user_campaigns(
            user.id, status=status, page=page, per_page=per_page
        )

        items = [CampaignResponse.model_validate(c) for c in campaigns]
        pages = math.ceil(total / per_page) if total > 0 else 1

        return CampaignListResponse(
            items=items,
            total=total,
            page=page,
            per_page=per_page,
            pages=pages,
        )

    async def get_map_markers(self) -> list[CampaignMapMarker]:
        """Map markers + TikTok-style metrics (DB stats or deterministic)."""
        EVENT_LABELS = {
            "blood_donation": "Donare sânge",
            "hackathon": "Hackathon",
            "volunteering": "Voluntariat",
            "recycling": "Reciclare",
            "community_gathering": "Adunare comunitară",
            "charity": "Strângere fonduri",
            "education": "Educație",
            "health": "Sănătate",
            "sports": "Sport comunitar",
            "culture": "Cultură",
            "animal_rescue": "Animale",
            "disaster_relief": "Urgențe",
            "marathon": "Maraton",
        }
        campaigns, _ = await self.repo.get_all_campaigns()
        markers = []
        for c in campaigns:
            id_str = str(c.id)
            seed = sum(ord(ch) for ch in id_str)
            if c.lat is not None and c.lng is not None:
                lat, lng = float(c.lat), float(c.lng)
                city_name = c.city or "—"
            else:
                cities = [
                    (44.4268, 26.1025, "București"),
                    (46.7712, 23.5901, "Cluj-Napoca"),
                    (45.7489, 21.2087, "Timișoara"),
                    (47.1585, 27.5681, "Iași"),
                    (44.1598, 28.6348, "Constanța"),
                ]
                city_lat, city_lng, city_name = cities[seed % len(cities)]
                lat = city_lat + (seed % 100) * 0.001 - 0.05
                lng = city_lng + (seed % 100) * 0.001 - 0.05
            ev = (c.event_type or "").strip() or None
            category = EVENT_LABELS.get(ev, ev or "Campanie comunitară")
            title = c.name or f"{category} · {city_name}"
            impressions = c.stats_impressions if c.stats_impressions is not None else (8000 + (seed * 7919) % 92000)
            clicks = c.stats_clicks if c.stats_clicks is not None else max(80, impressions // 200 + seed % 400)
            shares = c.stats_shares if c.stats_shares is not None else max(10, clicks // 8 + seed % 120)
            spend = float(c.stats_spend_ron) if c.stats_spend_ron is not None else round(float(c.budget) * 0.35 + (seed % 50), 2)
            ctr = round(100.0 * clicks / impressions, 2) if impressions else 0.0
            estimated_reach = impressions
            created = c.created_at.isoformat() if getattr(c, "created_at", None) else None
            markers.append(
                CampaignMapMarker(
                    id=c.id,
                    title=title,
                    lat=lat,
                    lng=lng,
                    city=city_name,
                    category=category,
                    event_type=ev,
                    estimated_reach=estimated_reach,
                    video_url=c.video_url,
                    impressions=impressions,
                    clicks=clicks,
                    shares=shares,
                    spend_ron=spend,
                    ctr_pct=ctr,
                    created_at=created,
                )
            )
        return markers

    async def update_campaign(
        self, user: User, campaign_id: uuid.UUID, data: CampaignUpdate
    ) -> CampaignResponse:
        """
        Update a campaign.
        
        Args:
            user: The requesting user
            campaign_id: Campaign ID
            data: Update data
        
        Returns:
            Updated campaign response
        
        Raises:
            CampaignNotFoundError: If campaign doesn't exist
            CampaignStatusError: If campaign is not in editable state
        """
        campaign = await self.repo.get_by_id_and_user(campaign_id, user.id)
        
        if not campaign:
            raise CampaignNotFoundError(f"Campaign {campaign_id} not found")

        # Allow editing DRAFT, PAUSED and ACTIVE campaigns
        if campaign.status not in [
            CampaignStatus.DRAFT.value,
            CampaignStatus.PAUSED.value,
            CampaignStatus.ACTIVE.value,
        ]:
            raise CampaignStatusError(
                f"Cannot update campaign in {campaign.status} status"
            )

        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "status" and value:
                # Status updates should go through dedicated methods
                continue
            setattr(campaign, field, value)

        campaign = await self.repo.update(campaign)
        return CampaignResponse.model_validate(campaign)

    async def delete_campaign(self, user: User, campaign_id: uuid.UUID) -> None:
        """
        Delete a campaign.
        
        Args:
            user: The requesting user
            campaign_id: Campaign ID
        
        Raises:
            CampaignNotFoundError: If campaign doesn't exist
            CampaignStatusError: If campaign is active
        """
        campaign = await self.repo.get_by_id_and_user(campaign_id, user.id)
        
        if not campaign:
            raise CampaignNotFoundError(f"Campaign {campaign_id} not found")

        # Don't allow deleting active campaigns
        if campaign.status == CampaignStatus.ACTIVE.value:
            raise CampaignStatusError("Cannot delete an active campaign. Pause it first.")

        await self.repo.delete(campaign)

    async def pause_campaign(
        self, user: User, campaign_id: uuid.UUID
    ) -> CampaignResponse:
        """
        Pause an active campaign.
        
        Args:
            user: The requesting user
            campaign_id: Campaign ID
        
        Returns:
            Updated campaign response
        
        Raises:
            CampaignNotFoundError: If campaign doesn't exist
            CampaignStatusError: If campaign cannot be paused
        """
        campaign = await self.repo.get_by_id_and_user(campaign_id, user.id)
        
        if not campaign:
            raise CampaignNotFoundError(f"Campaign {campaign_id} not found")

        if campaign.status != CampaignStatus.ACTIVE.value:
            raise CampaignStatusError(
                f"Cannot pause campaign in {campaign.status} status"
            )

        campaign = await self.repo.update_status(campaign, CampaignStatus.PAUSED)
        return CampaignResponse.model_validate(campaign)

    async def resume_campaign(
        self, user: User, campaign_id: uuid.UUID
    ) -> CampaignResponse:
        """
        Resume a paused campaign.
        
        Args:
            user: The requesting user
            campaign_id: Campaign ID
        
        Returns:
            Updated campaign response
        
        Raises:
            CampaignNotFoundError: If campaign doesn't exist
            CampaignStatusError: If campaign cannot be resumed
        """
        campaign = await self.repo.get_by_id_and_user(campaign_id, user.id)
        
        if not campaign:
            raise CampaignNotFoundError(f"Campaign {campaign_id} not found")

        if campaign.status != CampaignStatus.PAUSED.value:
            raise CampaignStatusError(
                f"Cannot resume campaign in {campaign.status} status"
            )

        campaign = await self.repo.update_status(campaign, CampaignStatus.ACTIVE)
        return CampaignResponse.model_validate(campaign)

    async def activate_campaign(
        self, user: User, campaign_id: uuid.UUID
    ) -> CampaignResponse:
        """
        Activate a draft campaign (publish it).
        
        Args:
            user: The requesting user
            campaign_id: Campaign ID
        
        Returns:
            Updated campaign response
        
        Raises:
            CampaignNotFoundError: If campaign doesn't exist
            CampaignStatusError: If campaign cannot be activated
        """
        campaign = await self.repo.get_by_id_and_user(campaign_id, user.id)
        
        if not campaign:
            raise CampaignNotFoundError(f"Campaign {campaign_id} not found")

        if campaign.status != CampaignStatus.DRAFT.value:
            raise CampaignStatusError(
                f"Cannot activate campaign in {campaign.status} status"
            )

        # Validate campaign is ready for activation
        if not campaign.ai_script:
            raise CampaignStatusError("Campaign must have an AI script before activation")

        campaign = await self.repo.update_status(campaign, CampaignStatus.ACTIVE)
        return CampaignResponse.model_validate(campaign)

    async def update_ai_script(
        self, user: User, campaign_id: uuid.UUID, ai_script: str, tokens_spent: int = 5
    ) -> CampaignResponse:
        """
        Update the AI-generated script for a campaign.
        
        Args:
            user: The requesting user
            campaign_id: Campaign ID
            ai_script: The generated script
            tokens_spent: Number of tokens used for generation
        
        Returns:
            Updated campaign response
        """
        campaign = await self.repo.get_by_id_and_user(campaign_id, user.id)
        
        if not campaign:
            raise CampaignNotFoundError(f"Campaign {campaign_id} not found")

        if campaign.status != CampaignStatus.DRAFT.value:
            raise CampaignStatusError("Can only update AI script for draft campaigns")

        campaign.ai_script = ai_script
        campaign = await self.repo.add_tokens_spent(campaign, tokens_spent)
        
        return CampaignResponse.model_validate(campaign)

