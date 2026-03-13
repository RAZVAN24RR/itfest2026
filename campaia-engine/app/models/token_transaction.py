from enum import Enum
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class TransactionType(str, Enum):
    PURCHASE = "PURCHASE"
    SPEND = "SPEND"
    REFUND = "REFUND"


class ActionType(str, Enum):
    SCRIPT = "SCRIPT"
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"
    TARGETING = "TARGETING"
    PURCHASE = "PURCHASE"  # When buying tokens
    BONUS = "BONUS"      # Free tokens


class TokenTransaction(BaseModel):
    """
    TokenTransaction model records all changes to user's token balance.
    """
    __tablename__ = "token_transactions"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False, comment="Positive for add, negative for spend")
    type: Mapped[str] = mapped_column(String(50), nullable=False) # Store as string for simplicity or use SQLEnum
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    action_type: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    user = relationship("User", back_populates="transactions")

    def __repr__(self):
        return f"<TokenTransaction(user_id={self.user_id}, amount={self.amount}, type={self.type})>"
