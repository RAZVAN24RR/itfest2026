"""
Campaia Engine - Audience Target Model

Model for managing campaign audience targeting settings.
"""

import uuid
from typing import List

from sqlalchemy import ForeignKey, Integer, String, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class AudienceTarget(BaseModel):
    """
    AudienceTarget model for campaign targeting settings.
    
    Stores geographic and demographic targeting criteria for a campaign.
    """

    __tablename__ = "audience_targets"

    # Relationship to Campaign
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Geographic Targeting
    countries: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=False, server_default='{}')
    regions: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=False, server_default='{}')
    cities: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=False, server_default='{}')

    # Demographic Targeting
    age_min: Mapped[int | None] = mapped_column(Integer, nullable=True, default=18)
    age_max: Mapped[int | None] = mapped_column(Integer, nullable=True, default=55)
    genders: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=False, server_default='{"ALL"}')

    # Interests & Behaviors
    interests: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=False, server_default='{}')
    
    # Technical targeting
    languages: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=False, server_default='{}')
    devices: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=False, server_default='{}')

    # Relationships
    campaign = relationship("Campaign", back_populates="target_audience")

    def __repr__(self) -> str:
        return f"<AudienceTarget(id={self.id}, campaign_id={self.campaign_id})>"
