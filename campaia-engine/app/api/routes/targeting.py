from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict
from uuid import UUID

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.targeting_service import TargetingService
from app.services.campaign_service import CampaignService
from app.schemas.targeting import AudienceTargetUpdate, AudienceTargetResponse

router = APIRouter(prefix="/targeting", tags=["Targeting"])

@router.get("/{campaign_id}", response_model=AudienceTargetResponse)
async def get_campaign_targeting(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get audience targeting for a campaign."""
    campaign_service = CampaignService(db)
    # This will check if campaign exists and user owns it
    await campaign_service.get_campaign(current_user, campaign_id)
    
    service = TargetingService(db)
    target = await service.get_target_by_campaign(campaign_id)
    
    if not target:
        # Create default empty target if it doesn't exist
        return await service.create_or_update_target(campaign_id, AudienceTargetUpdate())
        
    return AudienceTargetResponse.model_validate(target)

@router.post("/{campaign_id}", response_model=AudienceTargetResponse)
async def update_campaign_targeting(
    campaign_id: UUID,
    data: AudienceTargetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update audience targeting for a campaign."""
    campaign_service = CampaignService(db)
    await campaign_service.get_campaign(current_user, campaign_id)
    
    service = TargetingService(db)
    return await service.create_or_update_target(campaign_id, data)

@router.post("/validate")
async def validate_targeting(
    data: AudienceTargetUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Validate targeting criteria without saving."""
    # Use a dummy campaign_id for validation if needed, or just validate logic
    if data.age_min and data.age_max and data.age_min > data.age_max:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Min age cannot be greater than max age"
        )
    return {"valid": True}

@router.get("/locations/countries")
async def get_countries(language: str = "en"):
    """Get list of supported countries."""
    return [{"code": "RO", "name": "Romania" if language == "en" else "România"}]

@router.get("/locations/regions")
async def get_regions(country: str, language: str = "en"):
    """Get list of regions for a country."""
    if country == "RO":
        return [
            {"id": "RO-B", "name": "București"},
            {"id": "RO-CJ", "name": "Cluj"},
            {"id": "RO-TM", "name": "Timiș"},
            {"id": "RO-IS", "name": "Iași"},
        ]
    return []

@router.get("/locations/cities")
async def get_cities(country: str, region: str = None, language: str = "en"):
    """Get list of cities for a country/region."""
    if country == "RO" and region == "RO-B":
        return [{"id": "RO-BUC", "name": "București"}]
    return []

@router.get("/interests")
async def get_interests(
    language: str = "en",
    db: AsyncSession = Depends(get_db)
):
    """Get list of available interests."""
    service = TargetingService(db)
    return await service.get_available_interests(language)
