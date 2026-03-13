import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audience_target import AudienceTarget
from app.schemas.targeting import (
    AudienceTargetResponse,
    AudienceTargetUpdate,
)


class TargetingService:
    """Service for audience targeting business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_target_by_campaign(
        self, campaign_id: uuid.UUID
    ) -> Optional[AudienceTarget]:
        """Get audience targeting for a campaign."""
        result = await self.db.execute(
            select(AudienceTarget).where(AudienceTarget.campaign_id == campaign_id)
        )
        return result.scalars().first()

    async def create_or_update_target(
        self, campaign_id: uuid.UUID, data: AudienceTargetUpdate
    ) -> AudienceTargetResponse:
        """Create or update audience targeting for a campaign."""
        target = await self.get_target_by_campaign(campaign_id)

        if not target:
            # Create new target
            target_data = data.model_dump(exclude_unset=True)
            target = AudienceTarget(
                campaign_id=campaign_id,
                **target_data
            )
            self.db.add(target)
        else:
            # Update existing target
            update_data = data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(target, field, value)

        await self.db.commit()
        await self.db.refresh(target)
        return AudienceTargetResponse.model_validate(target)

    async def validate_targeting(self, target: AudienceTarget) -> bool:
        """
        Validate that the targeting criteria are valid and compatible.
        """
        if target.age_min and target.age_max and target.age_min > target.age_max:
            return False
        return True

    async def get_available_interests(self, language: str = "en") -> List[str]:
        """Get list of available interests."""
        # Static list for now
        interests = {
            "ro": ["Sport", "Modă", "Tehnologie", "Mâncare", "Călătorii", "Fitness", "Frumusețe", "Gaming", "Afaceri"],
            "en": ["Sports", "Fashion", "Technology", "Food", "Travel", "Fitness", "Beauty", "Gaming", "Business"]
        }
        return interests.get(language, interests["en"])
