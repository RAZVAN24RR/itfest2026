from uuid import UUID
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class AudienceTargetBase(BaseModel):
    """Base schema for audience targeting."""
    countries: List[str] = Field(default_factory=list)
    regions: List[str] = Field(default_factory=list)
    cities: List[str] = Field(default_factory=list)
    age_min: Optional[int] = 18
    age_max: Optional[int] = 55
    genders: List[str] = Field(default_factory=lambda: ["ALL"])
    interests: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    devices: List[str] = Field(default_factory=list)


class AudienceTargetCreate(AudienceTargetBase):
    """Schema for creating audience targeting."""
    campaign_id: UUID


class AudienceTargetUpdate(BaseModel):
    """Schema for updating audience targeting (all fields optional)."""
    countries: Optional[List[str]] = None
    regions: Optional[List[str]] = None
    cities: Optional[List[str]] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    genders: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    devices: Optional[List[str]] = None


class AudienceTargetResponse(AudienceTargetBase):
    """Schema for audience targeting response."""
    id: UUID
    campaign_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
