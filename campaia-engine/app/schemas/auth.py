"""
Campaia Engine - Auth Schemas

Pydantic schemas for authentication-related requests and responses.
"""

from pydantic import BaseModel, Field


class Token(BaseModel):
    """JWT token response schema."""

    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """JWT token payload schema."""

    sub: str  # User ID
    exp: int  # Expiration timestamp


class GoogleAuthRequest(BaseModel):
    """
    Schema for Google OAuth authentication.
    
    Frontend sends the access_token obtained from Google OAuth.
    Backend validates it and creates/finds the user.
    """

    access_token: str = Field(
        ..., description="Google OAuth access token from frontend"
    )


class GoogleUserInfo(BaseModel):
    """Schema for Google user info response."""

    sub: str  # Google user ID
    email: str
    name: str
    picture: str | None = None
    email_verified: bool = True


class AuthResponse(BaseModel):
    """Response after successful authentication."""

    access_token: str
    token_type: str = "bearer"
    user: dict  # User data for frontend


class RefreshTokenRequest(BaseModel):
    """Schema for token refresh request."""

    refresh_token: str
