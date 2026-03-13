"""Campaia Engine - Pydantic Schemas."""

from app.schemas.auth import (
    AuthResponse,
    GoogleAuthRequest,
    GoogleUserInfo,
    Token,
    TokenPayload,
)
from app.schemas.campaign import (
    CampaignCreate,
    CampaignListResponse,
    CampaignResponse,
    CampaignScriptUpdate,
    CampaignStatusUpdate,
    CampaignUpdate,
)
from app.schemas.profile import (
    BusinessDetails,
    ProfileCompletionStatus,
    ProfileResponse,
    ProfileUpdate,
)
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserProfileResponse,
    UserResponse,
    UserUpdate,
)

__all__ = [
    # Auth
    "Token",
    "TokenPayload",
    "GoogleAuthRequest",
    "GoogleUserInfo",
    "AuthResponse",
    # Campaign
    "CampaignCreate",
    "CampaignUpdate",
    "CampaignResponse",
    "CampaignListResponse",
    "CampaignStatusUpdate",
    "CampaignScriptUpdate",
    # Profile
    "ProfileUpdate",
    "ProfileResponse",
    "BusinessDetails",
    "ProfileCompletionStatus",
    # User
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "UserProfileResponse",
    "UserUpdate",
]

