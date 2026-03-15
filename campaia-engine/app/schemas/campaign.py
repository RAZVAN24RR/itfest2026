"""
Campaia Engine - Campaign Schemas

Pydantic schemas for campaign-related requests and responses.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.campaign import CampaignStatus


class CampaignBase(BaseModel):
    """Base campaign schema with common fields."""

    url: str = Field(..., min_length=1, max_length=500)
    budget: Decimal = Field(default=Decimal("50.00"), ge=10, le=10000)
    duration: int = Field(default=7, ge=1, le=365)
    product_desc: str | None = Field(None, max_length=5000)
    event_type: str | None = Field(None, max_length=50)
    lat: float | None = None
    lng: float | None = None
    city: str | None = Field(None, max_length=100)


class CampaignCreate(CampaignBase):
    """Schema for creating a new campaign."""

    name: str | None = Field(None, max_length=255)
    video_id: UUID | None = None


class CampaignUpdate(BaseModel):
    """Schema for updating a campaign."""

    name: str | None = Field(None, max_length=255)
    url: str | None = Field(None, min_length=1, max_length=500)
    budget: Decimal | None = Field(None, ge=10, le=10000)
    duration: int | None = Field(None, ge=1, le=365)
    product_desc: str | None = Field(None, max_length=5000)
    ai_script: str | None = Field(None, max_length=10000)
    status: CampaignStatus | None = None
    event_type: str | None = Field(None, max_length=50)
    video_id: UUID | None = None
    video_url: str | None = None
    lat: float | None = None
    lng: float | None = None
    city: str | None = Field(None, max_length=100)


class CampaignResponse(BaseModel):
    """Schema for campaign response."""

    id: UUID
    user_id: UUID
    name: str | None = None
    url: str
    budget: Decimal
    duration: int
    product_desc: str | None = None
    ai_script: str | None = None
    status: CampaignStatus
    tokens_spent: int = 0
    target_audience_id: UUID | None = None
    tiktok_ad_id: str | None = None
    tiktok_campaign_id: str | None = None
    video_url: str | None = None
    video_id: UUID | None = None
    event_type: str | None = None
    lat: float | None = None
    lng: float | None = None
    city: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CampaignListResponse(BaseModel):
    """Schema for paginated campaign list response."""

    items: list[CampaignResponse]
    total: int
    page: int
    per_page: int
    pages: int


class CampaignStatusUpdate(BaseModel):
    """Schema for updating campaign status (pause/resume)."""

    status: CampaignStatus


class CampaignScriptUpdate(BaseModel):
    """Schema for updating AI-generated script."""

    ai_script: str = Field(..., min_length=1, max_length=10000)
    tokens_spent: int = Field(default=5, ge=0)


class CampaignMapMarker(BaseModel):
    """Schema for campaign map display."""

    id: UUID
    title: str
    lat: float
    lng: float
    city: str | None = None
    category: str
    event_type: str | None = None
    estimated_reach: int
    video_url: str | None = None
    impressions: int = 0
    clicks: int = 0
    shares: int = 0
    spend_ron: float = 0.0
    ctr_pct: float = 0.0
    created_at: str | None = None


