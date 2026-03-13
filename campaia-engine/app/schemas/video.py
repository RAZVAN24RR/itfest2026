"""
Campaia Engine - Video Schemas

Pydantic schemas for video generation endpoints.
"""

from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field


class VideoStatusEnum(str, Enum):
    """Video generation status."""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    UPLOADING = "UPLOADING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class VideoQualityEnum(str, Enum):
    """Video quality options."""
    STANDARD = "STANDARD"      # 720p
    PROFESSIONAL = "PROFESSIONAL"  # 1080p


class VideoDurationEnum(str, Enum):
    """Video duration options."""
    SHORT = "5"    # 5 seconds
    LONG = "10"    # 10 seconds


class VideoGenerateRequest(BaseModel):
    """Request to generate a video."""
    prompt: str = Field(..., min_length=10, description="Video generation prompt/description")
    script: Optional[str] = Field(None, description="AI script to use for the video")
    campaign_id: Optional[str] = Field(None, description="Associated campaign ID")
    duration: VideoDurationEnum = Field(default=VideoDurationEnum.SHORT, description="Video duration (5 or 10 seconds)")
    quality: VideoQualityEnum = Field(default=VideoQualityEnum.STANDARD, description="Video quality")


class VideoGenerateResponse(BaseModel):
    """Response after initiating video generation."""
    id: str
    status: VideoStatusEnum
    estimated_time_seconds: int
    tokens_cost: int
    message: str


class VideoStatusResponse(BaseModel):
    """Response with video generation status."""
    id: str
    status: VideoStatusEnum
    progress_percent: int
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    error_message: Optional[str] = None
    duration: str
    quality: str
    tokens_spent: int
    created_at: str


class VideoListItem(BaseModel):
    """Video item for listing."""
    id: str
    status: VideoStatusEnum
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: str
    quality: str
    prompt: str
    tokens_spent: int
    created_at: str
    campaign_id: Optional[str] = None
    user_id: Optional[str] = None
    title: Optional[str] = None


class VideoListResponse(BaseModel):
    """Response with list of videos."""
    videos: list[VideoListItem]
    total: int


class VideoUploadResponse(BaseModel):
    """Response after uploading a user video."""
    id: str
    video_url: str
    thumbnail_url: Optional[str] = None
    file_size_bytes: int
    duration_seconds: Optional[int] = None
    message: str


# Token costs for video generation
VIDEO_TOKEN_COSTS = {
    # (duration, quality): cost
    ("5", "STANDARD"): 50,
    ("5", "PROFESSIONAL"): 80,
    ("10", "STANDARD"): 80,
    ("10", "PROFESSIONAL"): 150,
}


def get_video_token_cost(duration: str, quality: str) -> int:
    """Get token cost for video generation."""
    return VIDEO_TOKEN_COSTS.get((duration, quality), 50)
