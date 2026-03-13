"""
Campaia Engine - TikTok Integration Schemas

Pydantic schemas for TikTok Ads API integration.
"""

from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


# ==========================================
# TIKTOK INTEGRATION STATUS
# ==========================================

class TikTokConnectionStatus(BaseModel):
    """Status of TikTok integration connection."""
    connected: bool
    environment: str = "sandbox"
    advertiser_id: Optional[str] = None
    advertiser_name: Optional[str] = None
    balance: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[str] = None
    error: Optional[str] = None


# ==========================================
# PUBLISH CAMPAIGN
# ==========================================

class TikTokPublishRequest(BaseModel):
    """Request to publish a Campaia campaign to TikTok."""
    campaign_id: UUID = Field(..., description="Campaia campaign ID")
    
    class Config:
        json_schema_extra = {
            "example": {
                "campaign_id": "123e4567-e89b-12d3-a456-426614174000",
            }
        }


class TikTokPublishResponse(BaseModel):
    """Response after publishing to TikTok."""
    success: bool
    message: str
    tiktok_campaign_id: Optional[str] = None
    tiktok_adgroup_id: Optional[str] = None
    tiktok_ad_id: Optional[str] = None
    tiktok_video_id: Optional[str] = None
    environment: Optional[str] = None
    error: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Campaign published to TikTok successfully",
                "tiktok_campaign_id": "1234567890",
                "tiktok_adgroup_id": "1234567891",
                "tiktok_ad_id": "1234567892",
                "tiktok_video_id": "v123456789",
                "environment": "sandbox",
            }
        }


# ==========================================
# CAMPAIGN STATUS
# ==========================================

class TikTokCampaignStatusRequest(BaseModel):
    """Request to get TikTok campaign status."""
    tiktok_campaign_id: str = Field(..., description="TikTok campaign ID")


class TikTokCampaignStatus(BaseModel):
    """TikTok campaign status response."""
    success: bool
    status: Optional[str] = None
    budget: Optional[float] = None
    spend: Optional[float] = None
    error: Optional[str] = None


# ==========================================
# PAUSE/RESUME
# ==========================================

class TikTokPauseResumeRequest(BaseModel):
    """Request to pause or resume a TikTok campaign."""
    campaign_id: UUID = Field(..., description="Campaia campaign ID (must have tiktok_campaign_id)")


class TikTokPauseResumeResponse(BaseModel):
    """Response for pause/resume action."""
    success: bool
    action: str  # "paused" or "resumed"
    error: Optional[str] = None


# ==========================================
# VIDEO UPLOAD
# ==========================================

class TikTokVideoUploadRequest(BaseModel):
    """Request to upload video to TikTok."""
    video_url: str = Field(..., description="Public URL of the video")
    video_name: str = Field(..., description="Name for the video asset")


class TikTokVideoUploadResponse(BaseModel):
    """Response after video upload."""
    success: bool
    video_id: Optional[str] = None
    error: Optional[str] = None


# ==========================================
# ACCOUNT BALANCE
# ==========================================

class TikTokAccountBalance(BaseModel):
    """TikTok account balance info."""
    balance: float
    currency: str = "EUR"
    timezone: str = "Europe/Bucharest"
    status: str = "UNKNOWN"
