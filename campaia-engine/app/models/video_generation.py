"""
Campaia Engine - Video Generation Model

Tracks video generation jobs (multi-provider: Kling + alternates + fallback).
"""

from enum import Enum
from typing import Optional

from sqlalchemy import (
    Column,
    String,
    Integer,
    ForeignKey,
    Text,
    Enum as SQLEnum,
    Boolean,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class VideoStatus(str, Enum):
    """Status of video generation job."""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    UPLOADING = "UPLOADING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class VideoQuality(str, Enum):
    STANDARD = "STANDARD"
    PROFESSIONAL = "PROFESSIONAL"


class VideoDuration(str, Enum):
    SHORT = "5"
    LONG = "10"


class VideoGeneration(BaseModel):
    __tablename__ = "video_generations"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    campaign_id = Column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    prompt = Column(Text, nullable=False)
    script = Column(Text, nullable=True)
    duration = Column(
        SQLEnum(VideoDuration),
        default=VideoDuration.SHORT,
        nullable=False,
    )
    quality = Column(
        SQLEnum(VideoQuality),
        default=VideoQuality.STANDARD,
        nullable=False,
    )

    # Multi-provider
    video_provider = Column(String(32), default="KLING", nullable=False)  # requested
    provider_used = Column(String(32), nullable=True)  # actual engine (after fallback)
    fallback_used = Column(Boolean, default=False, nullable=False)
    aspect_ratio = Column(String(16), default="9:16", nullable=False)
    generation_duration_ms = Column(Integer, nullable=True)

    kling_task_id = Column(String(255), nullable=True, index=True)
    kling_status = Column(String(50), nullable=True)

    status = Column(
        SQLEnum(VideoStatus),
        default=VideoStatus.PENDING,
        nullable=False,
        index=True,
    )
    error_message = Column(Text, nullable=True)
    progress_percent = Column(Integer, default=0)

    video_url = Column(String(1024), nullable=True)
    thumbnail_url = Column(String(1024), nullable=True)
    s3_key = Column(String(512), nullable=True)
    s3_thumbnail_key = Column(String(512), nullable=True)

    file_size_bytes = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)

    tokens_spent = Column(Integer, default=0)
    is_public = Column(Integer, default=1)
    title = Column(String(255), nullable=True)

    user = relationship("User", back_populates="video_generations")
    campaign = relationship(
        "Campaign",
        back_populates="videos",
        foreign_keys=[campaign_id],
    )

    def __repr__(self) -> str:
        return f"<VideoGeneration {self.id} status={self.status}>"
