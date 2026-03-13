"""
Campaia Engine - Campaign Model

Campaign model for managing advertising campaigns.
"""

import uuid
from decimal import Decimal
from enum import Enum

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class CampaignStatus(str, Enum):
    """Campaign status enum."""

    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Campaign(BaseModel):
    """
    Campaign model for advertising campaigns.
    
    Represents a TikTok advertising campaign created by a user.
    """

    __tablename__ = "campaigns"

    # Owner relationship
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Campaign details
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    
    # Budget configuration
    budget: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=50.00
    )
    duration: Mapped[int] = mapped_column(Integer, nullable=False, default=7)

    # AI content
    product_desc: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_script: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Status tracking
    status: Mapped[str] = mapped_column(
        String(20), default=CampaignStatus.DRAFT.value, nullable=False
    )

    # Token tracking
    tokens_spent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Future: Targeting (will be linked when audience targeting is implemented)
    target_audience_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # TikTok integration (filled when published to TikTok)
    tiktok_ad_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tiktok_campaign_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tiktok_adgroup_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Video URL (from Kling AI generation, used for TikTok publishing)
    video_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Video creative linked to this campaign
    video_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("video_generations.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    user = relationship("User", back_populates="campaigns")
    # Videos generated FOR this campaign (via campaign_id in video_generations)
    videos = relationship(
        "VideoGeneration", 
        back_populates="campaign", 
        lazy="dynamic",
        foreign_keys="[VideoGeneration.campaign_id]"
    )
    # The selected video creative for this campaign (via video_id here)
    selected_video = relationship(
        "VideoGeneration",
        foreign_keys=[video_id],
        uselist=False
    )
    
    # Targeting details
    target_audience = relationship(
        "AudienceTarget",
        back_populates="campaign",
        uselist=False,
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Campaign(id={self.id}, user_id={self.user_id}, status={self.status})>"

