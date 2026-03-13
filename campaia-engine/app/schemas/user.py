"""
Campaia Engine - User Schemas

Pydantic schemas for user-related requests and responses.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserType


class UserBase(BaseModel):
    """Base user schema with common fields."""

    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)


class UserCreate(UserBase):
    """Schema for creating a new user with email/password."""

    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    """Schema for email/password login."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response (public data)."""

    id: UUID
    email: str
    full_name: str
    picture_url: str | None = None
    user_type: UserType = UserType.INDIVIDUAL
    is_active: bool = True
    is_verified: bool = False
    profile_completed: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfileResponse(UserResponse):
    """Extended user response with profile details."""

    phone: str | None = None
    company_name: str | None = None
    cui: str | None = None
    reg_com: str | None = None
    address: str | None = None
    city: str | None = None
    county: str | None = None
    country: str | None = None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
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
