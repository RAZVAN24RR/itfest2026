"""
Campaia Engine - Video Generation Model

Tracks video generation jobs from Kling AI.
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
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class VideoStatus(str, Enum):
    """Status of video generation job."""
    PENDING = "PENDING"           # Job created, waiting to start
    PROCESSING = "PROCESSING"     # Kling AI is generating
    UPLOADING = "UPLOADING"       # Downloading from Kling, uploading to S3
    COMPLETED = "COMPLETED"       # Video ready
    FAILED = "FAILED"             # Generation failed


class VideoQuality(str, Enum):
    """Video quality/resolution."""
    STANDARD = "STANDARD"   # 720p
    PROFESSIONAL = "PROFESSIONAL"  # 1080p


class VideoDuration(str, Enum):
    """Video duration options."""
    SHORT = "5"    # 5 seconds
    LONG = "10"    # 10 seconds


class VideoGeneration(BaseModel):
    """
    Video generation job model.
    
    Tracks the status and results of AI video generation.
    """
    
    __tablename__ = "video_generations"
    
    # Relationships
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
    
    # Generation parameters
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
    
    # Kling AI tracking
    kling_task_id = Column(String(255), nullable=True, index=True)
    kling_status = Column(String(50), nullable=True)
    
    # Status
    status = Column(
        SQLEnum(VideoStatus),
        default=VideoStatus.PENDING,
        nullable=False,
        index=True,
    )
    error_message = Column(Text, nullable=True)
    progress_percent = Column(Integer, default=0)
    
    # Results
    video_url = Column(String(1024), nullable=True)  # S3/CloudFront URL
    thumbnail_url = Column(String(1024), nullable=True)
    s3_key = Column(String(512), nullable=True)
    s3_thumbnail_key = Column(String(512), nullable=True)
    
    # File info
    file_size_bytes = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    
    # Tokens
    tokens_spent = Column(Integer, default=0)
    
    # Community/Public settings
    is_public = Column(Integer, default=1)  # 1 = public (visible in feed), 0 = private
    title = Column(String(255), nullable=True)  # Optional title for display
    
    # Relationships
    user = relationship("User", back_populates="video_generations")
    campaign = relationship(
        "Campaign", 
        back_populates="videos",
        foreign_keys=[campaign_id]
    )
    
    def __repr__(self) -> str:
        return f"<VideoGeneration {self.id} status={self.status}>"
