"""
Campaia Engine - Campaign Schedule Model

Stores automated scheduling rules for campaigns:
when to activate/pause based on days of week and time windows.
"""

import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Time
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class CampaignSchedule(BaseModel):
    """
    Automated schedule for a campaign.

    Defines which days and hours a campaign should be active.
    The scheduler service checks these and toggles campaign status.
    """

    __tablename__ = "campaign_schedules"

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Days of week: 0=Monday, 6=Sunday
    days_of_week: Mapped[list[int]] = mapped_column(
        ARRAY(Integer), default=[0, 1, 2, 3, 4], nullable=False
    )

    # Time window (Romania timezone EET/EEST)
    start_time: Mapped[str] = mapped_column(String(5), default="09:00", nullable=False)
    end_time: Mapped[str] = mapped_column(String(5), default="21:00", nullable=False)

    # Timezone reference
    timezone: Mapped[str] = mapped_column(String(50), default="Europe/Bucharest", nullable=False)

    # Relationships
    campaign = relationship("Campaign", backref="schedule", uselist=False)
