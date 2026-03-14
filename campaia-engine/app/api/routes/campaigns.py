"""
Campaia Engine - Campaign Routes

API endpoints for campaign CRUD operations.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import CurrentUser, DbSession
from app.models.campaign import CampaignStatus
from app.schemas.campaign import (
    CampaignCreate,
    CampaignListResponse,
    CampaignResponse,
    CampaignScriptUpdate,
    CampaignUpdate,
    CampaignMapMarker,
)
from app.services.campaign_service import (
    CampaignNotFoundError,
    CampaignService,
    CampaignStatusError,
)

router = APIRouter()


@router.post(
    "",
    response_model=CampaignResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new campaign",
)
async def create_campaign(
    data: CampaignCreate,
    user: CurrentUser,
    db: DbSession,
) -> CampaignResponse:
    """
    Create a new campaign for the authenticated user.
    
    The campaign is created in DRAFT status.
    """
    service = CampaignService(db)
    return await service.create_campaign(user, data)


@router.get(
    "",
    response_model=CampaignListResponse,
    summary="List user campaigns",
)
async def list_campaigns(
    user: CurrentUser,
    db: DbSession,
    status_filter: Annotated[
        CampaignStatus | None,
        Query(alias="status", description="Filter by campaign status"),
    ] = None,
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    per_page: Annotated[
        int, Query(ge=1, le=100, description="Items per page")
    ] = 20,
) -> CampaignListResponse:
    """
    List all campaigns for the authenticated user.
    
    Supports pagination and optional status filtering.
    """
    service = CampaignService(db)
    return await service.list_campaigns(
        user, status=status_filter, page=page, per_page=per_page
    )


@router.get(
    "/map",
    response_model=list[CampaignMapMarker],
    summary="Get campaign map markers",
)
async def get_campaign_map(
    db: DbSession,
) -> list[CampaignMapMarker]:
    """Get all campaigns mapped for the community map."""
    service = CampaignService(db)
    return await service.get_map_markers()


@router.get(
    "/{campaign_id}",
    response_model=CampaignResponse,
    summary="Get campaign details",
)
async def get_campaign(
    campaign_id: UUID,
    user: CurrentUser,
    db: DbSession,
) -> CampaignResponse:
    """Get a specific campaign by ID."""
    service = CampaignService(db)
    try:
        return await service.get_campaign(user, campaign_id)
    except CampaignNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.patch(
    "/{campaign_id}",
    response_model=CampaignResponse,
    summary="Update campaign",
)
async def update_campaign(
    campaign_id: UUID,
    data: CampaignUpdate,
    user: CurrentUser,
    db: DbSession,
) -> CampaignResponse:
    """
    Update a campaign.
    
    Only DRAFT and PAUSED campaigns can be edited.
    """
    service = CampaignService(db)
    try:
        return await service.update_campaign(user, campaign_id, data)
    except CampaignNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except CampaignStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete(
    "/{campaign_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete campaign",
)
async def delete_campaign(
    campaign_id: UUID,
    user: CurrentUser,
    db: DbSession,
) -> None:
    """
    Delete a campaign.
    
    Active campaigns cannot be deleted - pause them first.
    """
    service = CampaignService(db)
    try:
        await service.delete_campaign(user, campaign_id)
    except CampaignNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except CampaignStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/{campaign_id}/pause",
    response_model=CampaignResponse,
    summary="Pause campaign",
)
async def pause_campaign(
    campaign_id: UUID,
    user: CurrentUser,
    db: DbSession,
) -> CampaignResponse:
    """Pause an active campaign."""
    service = CampaignService(db)
    try:
        return await service.pause_campaign(user, campaign_id)
    except CampaignNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except CampaignStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/{campaign_id}/resume",
    response_model=CampaignResponse,
    summary="Resume campaign",
)
async def resume_campaign(
    campaign_id: UUID,
    user: CurrentUser,
    db: DbSession,
) -> CampaignResponse:
    """Resume a paused campaign."""
    service = CampaignService(db)
    try:
        return await service.resume_campaign(user, campaign_id)
    except CampaignNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except CampaignStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/{campaign_id}/activate",
    response_model=CampaignResponse,
    summary="Activate campaign",
)
async def activate_campaign(
    campaign_id: UUID,
    user: CurrentUser,
    db: DbSession,
) -> CampaignResponse:
    """
    Activate a draft campaign (publish it).
    
    The campaign must have an AI script before activation.
    """
    service = CampaignService(db)
    try:
        return await service.activate_campaign(user, campaign_id)
    except CampaignNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except CampaignStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/{campaign_id}/script",
    response_model=CampaignResponse,
    summary="Update AI script",
)
async def update_campaign_script(
    campaign_id: UUID,
    data: CampaignScriptUpdate,
    user: CurrentUser,
    db: DbSession,
) -> CampaignResponse:
    """
    Update the AI-generated script for a campaign.
    
    This will also track the tokens spent on generation.
    """
    service = CampaignService(db)
    try:
        return await service.update_ai_script(
            user, campaign_id, data.ai_script, data.tokens_spent
        )
    except CampaignNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except CampaignStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

