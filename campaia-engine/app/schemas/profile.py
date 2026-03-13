"""
Campaia Engine - Profile Schemas

Pydantic schemas for profile management.
"""

from pydantic import BaseModel, Field

from app.models.user import UserType


class ProfileUpdate(BaseModel):
    """Schema for updating user profile."""

    full_name: str | None = Field(None, min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=20)
    user_type: UserType | None = None

    # Business fields
    company_name: str | None = Field(None, max_length=255)
    cui: str | None = Field(None, max_length=20)
    reg_com: str | None = Field(None, max_length=50)
    address: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=100)
    county: str | None = Field(None, max_length=100)
    country: str | None = Field(None, max_length=100)


class BusinessDetails(BaseModel):
    """Schema for business-specific details."""

    company_name: str = Field(..., min_length=1, max_length=255)
    cui: str = Field(..., min_length=1, max_length=20)
    reg_com: str | None = Field(None, max_length=50)
    address: str = Field(..., min_length=1, max_length=500)
    city: str = Field(..., min_length=1, max_length=100)
    county: str = Field(..., min_length=1, max_length=100)
    country: str = Field(default="Romania", max_length=100)


class ProfileResponse(BaseModel):
    """Full profile response schema."""

    id: str
    email: str
    full_name: str
    picture_url: str | None = None
    user_type: UserType = UserType.INDIVIDUAL
    is_active: bool = True
    is_verified: bool = False
    profile_completed: bool = False

    # Extended profile
    phone: str | None = None

    # Business details
    company_name: str | None = None
    cui: str | None = None
    reg_com: str | None = None
    address: str | None = None
    city: str | None = None
    county: str | None = None
    country: str | None = None

    model_config = {"from_attributes": True}


class ProfileCompletionStatus(BaseModel):
    """Schema for checking profile completion."""

    is_complete: bool
    missing_fields: list[str] = []
    percentage: int = 0
