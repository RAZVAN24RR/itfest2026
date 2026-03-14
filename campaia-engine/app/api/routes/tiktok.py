"""
Campaia Engine - TikTok Integration API Routes

Endpoints pentru integrarea TikTok Ads:
- Status conexiune
- Publicare campanie
- Pause/Resume campanii
- Verificare status
"""

import logging
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.campaign import Campaign
from app.schemas.tiktok import (
    TikTokConnectionStatus,
    TikTokPublishRequest,
    TikTokPublishResponse,
    TikTokCampaignStatus,
    TikTokPauseResumeResponse,
    TikTokAccountBalance,
)
from app.core.config import settings
from app.services.tiktok import tiktok_client, tiktok_ad_publisher

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tiktok", tags=["TikTok Integration"])


# ==========================================
# CONNECTION STATUS
# ==========================================

@router.get(
    "/status",
    response_model=TikTokConnectionStatus,
    summary="Check TikTok connection status",
    description="Check if TikTok Ads integration is connected and working.",
)
async def get_tiktok_status(
    current_user: CurrentUser,
) -> TikTokConnectionStatus:
    """
    Check TikTok integration status.
    
    Returns connection status, account info, and balance.
    Only accessible by authenticated users.
    """
    logger.info(f"Checking TikTok status for user {current_user.email}")
    result = await tiktok_client.check_connection()
    logger.info(f"TikTok status result: {result}")
    return TikTokConnectionStatus(**result)


@router.get(
    "/balance",
    response_model=TikTokAccountBalance,
    summary="Get TikTok account balance",
    description="Get the current balance of Campaia's TikTok Ads account.",
)
async def get_tiktok_balance(
    current_user: CurrentUser,
) -> TikTokAccountBalance:
    """
    Get TikTok account balance.
    
    Shows available budget for running ads.
    """
    if not tiktok_client.is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TikTok integration not configured",
        )
    
    balance = await tiktok_client.get_account_balance()
    return TikTokAccountBalance(**balance)


# ==========================================
# PUBLISH CAMPAIGN
# ==========================================

@router.post(
    "/publish",
    response_model=TikTokPublishResponse,
    summary="Publish campaign to TikTok",
    description="Publish a Campaia campaign to TikTok Ads. Creates complete ad structure.",
)
async def publish_campaign_to_tiktok(
    request: TikTokPublishRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> TikTokPublishResponse:
    """
    Publish a campaign to TikTok Ads.
    
    Prerequisites:
    - Campaign must exist and belong to current user
    - Campaign must have a video URL (generated with Kling AI)
    - Campaign must have targeting configured
    
    This creates:
    1. TikTok Video Asset (from video URL)
    2. TikTok Campaign
    3. TikTok Ad Group (with targeting)
    4. TikTok Ad (with video and text)
    """
    # Check TikTok configuration
    if not tiktok_client.is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TikTok integration not configured. Contact support.",
        )
    
    # Get campaign
    result = await db.execute(
        select(Campaign).where(Campaign.id == request.campaign_id)
    )
    campaign = result.scalar_one_or_none()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )
    
    if campaign.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to publish this campaign",
        )
    
    # Check if campaign has video
    if not campaign.video_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign must have a video before publishing. Generate video first.",
        )
    
    # Check if already published
    if campaign.tiktok_campaign_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Campaign already published to TikTok: {campaign.tiktok_campaign_id}",
        )
    
    # Get targeting info
    targeting = campaign.target_audience
    countries = targeting.countries if targeting else ["RO"]
    age_min = targeting.age_min if targeting else 18
    age_max = targeting.age_max if targeting else 65
    gender = (targeting.genders[0] if targeting and targeting.genders else "all")
    interests = targeting.interests if targeting else None
    
    # Publish to TikTok
    logger.info(f"Publishing campaign {campaign.id} to TikTok for user {current_user.email}")
    
    publish_result = await tiktok_ad_publisher.publish_campaign(
        campaign_id=campaign.id,
        campaign_name=campaign.name or f"Campaign {campaign.id}",
        video_url=campaign.video_url,
        ad_text=campaign.ai_script or campaign.product_desc or "Check this out!",
        landing_page_url=campaign.url or "https://campaia.com",
        budget_daily=float(campaign.budget or 20),
        duration_days=campaign.duration or 7,
        countries=countries,
        age_min=age_min,
        age_max=age_max,
        gender=gender,
        interests=interests,
        user_email=current_user.email,
    )
    
    if publish_result.get("success"):
        # Update campaign with TikTok IDs
        campaign.tiktok_campaign_id = publish_result.get("tiktok_campaign_id")
        campaign.tiktok_adgroup_id = publish_result.get("tiktok_adgroup_id")
        campaign.tiktok_ad_id = publish_result.get("tiktok_ad_id")
        campaign.status = "ACTIVE"
        await db.commit()
        
        logger.info(f"Campaign {campaign.id} published successfully to TikTok")
        
        return TikTokPublishResponse(
            success=True,
            message="Campaign published to TikTok successfully!",
            tiktok_campaign_id=publish_result.get("tiktok_campaign_id"),
            tiktok_adgroup_id=publish_result.get("tiktok_adgroup_id"),
            tiktok_ad_id=publish_result.get("tiktok_ad_id"),
            tiktok_video_id=publish_result.get("tiktok_video_id"),
            environment=publish_result.get("environment"),
        )
    else:
        logger.error(f"Failed to publish campaign {campaign.id}: {publish_result.get('error')}")
        
        return TikTokPublishResponse(
            success=False,
            message="Failed to publish campaign to TikTok",
            error=publish_result.get("error"),
        )


# ==========================================
# PAUSE / RESUME
# ==========================================

@router.post(
    "/campaigns/{campaign_id}/pause",
    response_model=TikTokPauseResumeResponse,
    summary="Pause TikTok campaign",
    description="Pause a running TikTok campaign.",
)
async def pause_tiktok_campaign(
    campaign_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> TikTokPauseResumeResponse:
    """Pause a TikTok campaign."""
    result = await db.execute(
        select(Campaign).where(Campaign.id == campaign_id)
    )
    campaign = result.scalar_one_or_none()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not campaign.tiktok_campaign_id:
        raise HTTPException(
            status_code=400, 
            detail="Campaign not published to TikTok"
        )
    
    pause_result = await tiktok_ad_publisher.pause_campaign(campaign.tiktok_campaign_id)
    
    if pause_result.get("success"):
        campaign.status = "PAUSED"
        await db.commit()
        
        return TikTokPauseResumeResponse(
            success=True,
            action="paused",
        )
    else:
        return TikTokPauseResumeResponse(
            success=False,
            action="paused",
            error=pause_result.get("error"),
        )


@router.post(
    "/campaigns/{campaign_id}/resume",
    response_model=TikTokPauseResumeResponse,
    summary="Resume TikTok campaign",
    description="Resume a paused TikTok campaign.",
)
async def resume_tiktok_campaign(
    campaign_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> TikTokPauseResumeResponse:
    """Resume a paused TikTok campaign."""
    result = await db.execute(
        select(Campaign).where(Campaign.id == campaign_id)
    )
    campaign = result.scalar_one_or_none()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not campaign.tiktok_campaign_id:
        raise HTTPException(
            status_code=400, 
            detail="Campaign not published to TikTok"
        )
    
    resume_result = await tiktok_ad_publisher.resume_campaign(campaign.tiktok_campaign_id)
    
    if resume_result.get("success"):
        campaign.status = "ACTIVE"
        await db.commit()
        
        return TikTokPauseResumeResponse(
            success=True,
            action="resumed",
        )
    else:
        return TikTokPauseResumeResponse(
            success=False,
            action="resumed",
            error=resume_result.get("error"),
        )


# ==========================================
# CAMPAIGN STATUS
# ==========================================

@router.get(
    "/campaigns/{campaign_id}/status",
    response_model=TikTokCampaignStatus,
    summary="Get TikTok campaign status",
    description="Get the current status and metrics of a TikTok campaign.",
)
async def get_tiktok_campaign_status(
    campaign_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> TikTokCampaignStatus:
    """Get TikTok campaign status and spend."""
    result = await db.execute(
        select(Campaign).where(Campaign.id == campaign_id)
    )
    campaign = result.scalar_one_or_none()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not campaign.tiktok_campaign_id:
        raise HTTPException(
            status_code=400, 
            detail="Campaign not published to TikTok"
        )
    
    status_result = await tiktok_ad_publisher.get_campaign_status(campaign.tiktok_campaign_id)
    
    return TikTokCampaignStatus(**status_result)
@router.get(
    "/campaigns",
    summary="Get campaigns from TikTok",
    description="Get list of campaigns directly from TikTok Ads API.",
)
async def get_tiktok_campaigns(
    current_user: CurrentUser,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """
    Get list of campaigns directly from TikTok.
    Useful for verification and debug.
    """
    if not tiktok_client.is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TikTok integration not configured",
        )
    
    return await tiktok_client.get_campaigns(page=page, page_size=page_size)


@router.get(
    "/metrics",
    summary="Get TikTok account metrics",
    description="Get aggregated metrics (spend, impressions, clicks) from TikTok Ads API.",
)
async def get_tiktok_metrics(
    current_user: CurrentUser,
    days: int = 30,
) -> dict:
    """
    Get aggregated metrics for the advertiser account.
    """
    allowed = {
        e.strip().lower()
        for e in settings.tiktok_metrics_admin_emails.split(",")
        if e.strip()
    }
    if allowed and current_user.email.lower() not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can view TikTok metrics",
        )
        
    if not tiktok_client.is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TikTok integration not configured",
        )
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    return await tiktok_client.get_integrated_report(
        start_date=start_date.strftime("%Y-%m-%d"),
        end_date=end_date.strftime("%Y-%m-%d"),
    )
