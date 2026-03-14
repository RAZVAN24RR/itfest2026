"""
Campaia Engine - Video Schemas
"""

from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field


class VideoStatusEnum(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    UPLOADING = "UPLOADING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class VideoQualityEnum(str, Enum):
    STANDARD = "STANDARD"
    PROFESSIONAL = "PROFESSIONAL"


class VideoDurationEnum(str, Enum):
    SHORT = "5"
    LONG = "10"


class VideoProviderEnum(str, Enum):
    """Requested generation engine (UX maps to these)."""
    KLING = "KLING"
    RUNWAY = "RUNWAY"
    PIKA = "PIKA"
    STABLE_VIDEO = "STABLE_VIDEO"


class VideoGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=10)
    script: Optional[str] = None
    campaign_id: Optional[str] = None
    duration: VideoDurationEnum = VideoDurationEnum.SHORT
    quality: VideoQualityEnum = VideoQualityEnum.STANDARD
    provider: VideoProviderEnum = Field(
        default=VideoProviderEnum.KLING,
        description="Video generation style / primary provider",
    )


class VideoGenerateResponse(BaseModel):
    id: str
    status: VideoStatusEnum
    estimated_time_seconds: int
    tokens_cost: int
    message: str
    provider_requested: str
    fallback_note: Optional[str] = None


class VideoStatusResponse(BaseModel):
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
    provider_requested: str = "KLING"
    provider_used: Optional[str] = None
    fallback_used: bool = False
    aspect_ratio: str = "9:16"


class VideoListItem(BaseModel):
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
    provider_requested: str = "KLING"
    provider_used: Optional[str] = None
    fallback_used: bool = False
    aspect_ratio: str = "9:16"


class VideoListResponse(BaseModel):
    videos: list[VideoListItem]
    total: int


class VideoUploadResponse(BaseModel):
    id: str
    video_url: str
    thumbnail_url: Optional[str] = None
    file_size_bytes: int
    duration_seconds: Optional[int] = None
    message: str


class VideoProviderInfo(BaseModel):
    id: str
    label: str
    description: str
    token_multiplier: float


VIDEO_TOKEN_COSTS = {
    ("5", "STANDARD"): 50,
    ("5", "PROFESSIONAL"): 80,
    ("10", "STANDARD"): 80,
    ("10", "PROFESSIONAL"): 150,
}


def get_video_token_cost(duration: str, quality: str) -> int:
    return VIDEO_TOKEN_COSTS.get((duration, quality), 50)


def get_video_cost_with_provider(
    duration: str,
    quality: str,
    provider_id: str,
) -> int:
    from app.services.video_providers.base import VideoProviderId, provider_token_multiplier

    base = get_video_token_cost(duration, quality)
    try:
        p = VideoProviderId(provider_id)
    except ValueError:
        p = VideoProviderId.KLING
    return max(15, int(round(base * provider_token_multiplier(p))))
