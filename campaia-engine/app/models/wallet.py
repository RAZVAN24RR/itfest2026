from decimal import Decimal
from uuid import UUID

from sqlalchemy import ForeignKey, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Wallet(BaseModel):
    """
    Wallet model stores the user's token balance.
    One user has one wallet.
    """
    __tablename__ = "wallets"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), unique=True, index=True, nullable=False)
    balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    lifetime_purchased: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="Total tokens ever purchased")

    # Relationships
    user = relationship("User", back_populates="wallet")

    def __repr__(self):
        return f"<Wallet(user_id={self.user_id}, balance={self.balance})>"
