"""
Campaia Engine - User Model

User model for authentication and profile management.
"""

from enum import Enum

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class UserType(str, Enum):
    """User type enum for billing purposes."""

    INDIVIDUAL = "INDIVIDUAL"
    BUSINESS = "BUSINESS"


class User(BaseModel):
    """
    User model for authentication and profile.
    
    Supports both email/password and Google OAuth authentication.
    """

    __tablename__ = "users"

    # Authentication fields
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    google_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )

    # Profile fields
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    picture_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    user_type: Mapped[str] = mapped_column(
        String(20), default=UserType.INDIVIDUAL.value, nullable=False
    )

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Extended profile (to be filled later)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Business fields (only for BUSINESS type)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cui: Mapped[str | None] = mapped_column(String(20), nullable=True)  # CUI/CIF
    reg_com: Mapped[str | None] = mapped_column(String(50), nullable=True)  # J12/345/2020
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    county: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), default="Romania")

    # Profile completion flag
    profile_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    campaigns = relationship("Campaign", back_populates="user", lazy="dynamic")
    wallet = relationship("Wallet", back_populates="user", uselist=False, lazy="selectin")
    transactions = relationship("TokenTransaction", back_populates="user", lazy="dynamic", cascade="all, delete-orphan")
    video_generations = relationship("VideoGeneration", back_populates="user", lazy="dynamic", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"
