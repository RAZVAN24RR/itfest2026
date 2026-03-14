"""
Campaia Engine - Database Models

All models should be imported here for Alembic to detect them.
"""

from app.models.base import BaseModel, TimestampMixin
from app.models.user import User, UserType
from app.models.campaign import Campaign, CampaignStatus

# Import models here as they are created
from app.models.wallet import Wallet
from app.models.token_transaction import TokenTransaction, TransactionType, ActionType
from app.models.video_generation import VideoGeneration, VideoStatus, VideoQuality, VideoDuration
from app.models.audience_target import AudienceTarget
from app.models.invoice import Invoice, InvoiceType, InvoiceStatus
from app.models.campaign_schedule import CampaignSchedule

__all__ = [
    "BaseModel",
    "TimestampMixin",
    "User",
    "UserType",
    "Campaign",
    "CampaignStatus",
    "Wallet",
    "TokenTransaction",
    "TransactionType",
    "ActionType",
    "VideoGeneration",
    "VideoStatus",
    "VideoQuality",
    "VideoDuration",
    "AudienceTarget",
    "Invoice",
    "InvoiceType",
    "InvoiceStatus",
    "CampaignSchedule",
]
