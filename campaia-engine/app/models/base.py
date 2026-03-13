"""
Campaia Engine - Base Model

Base model class with common fields for all database models.
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, declared_attr, mapped_column

from app.core.database import Base


class TimestampMixin:
    """Mixin that adds created_at and updated_at timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class BaseModel(Base, TimestampMixin):
    """
    Base model class for all database models.
    
    Provides:
    - UUID primary key (id)
    - created_at timestamp
    - updated_at timestamp (auto-updates on modification)
    - Automatic table name from class name
    
    Usage:
        class User(BaseModel):
            __tablename__ = "users"
            email: Mapped[str] = mapped_column(String(255), unique=True)
    """

    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    @declared_attr.directive
    @classmethod
    def __tablename__(cls) -> str:
        """Generate table name from class name (CamelCase -> snake_case + s)."""
        name = cls.__name__
        # Convert CamelCase to snake_case
        result = [name[0].lower()]
        for char in name[1:]:
            if char.isupper():
                result.append("_")
                result.append(char.lower())
            else:
                result.append(char)
        return "".join(result) + "s"

    def to_dict(self) -> dict[str, Any]:
        """Convert model instance to dictionary."""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }

    def __repr__(self) -> str:
        """String representation of the model."""
        return f"<{self.__class__.__name__}(id={self.id})>"
