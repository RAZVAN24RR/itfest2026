"""
Campaia Engine - Invoice Model

Handles fiscal data for users and generated PDFs for billing.
"""

import uuid
from decimal import Decimal
from enum import Enum

from sqlalchemy import DECIMAL, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class InvoiceType(str, Enum):
    """INDIVIDUAL (simple receipt) or BUSINESS (fiscal invoice)."""
    INDIVIDUAL = "INDIVIDUAL"
    BUSINESS = "BUSINESS"


class InvoiceStatus(str, Enum):
    """Status of the invoice."""
    DRAFT = "DRAFT"
    ISSUED = "ISSUED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class Invoice(BaseModel):
    """
    Invoice model for tracking payments and tax compliance.
    
    Invoices can be for Individuals (no VAT deduction usually) or 
    Business (full fiscal data, VAT 19% in RO).
    """

    user_id: Mapped[uuid.UUID] = mapped_column(
        pgUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    
    invoice_number: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    
    invoice_type: Mapped[str] = mapped_column(
        String(20), default=InvoiceType.INDIVIDUAL.value, nullable=False
    )
    
    status: Mapped[str] = mapped_column(
        String(20), default=InvoiceStatus.DRAFT.value, nullable=False
    )
    
    # Financial details
    amount: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False)
    vat: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), default=0, nullable=False)
    total: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="EUR", nullable=False)
    
    issued_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    
    # External references
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )
    
    stripe_session_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )
    
    # Buyer data snapshot at the time of issuance (for compliance)
    # Includes: name, cui, reg_com, address, etc.
    buyer_details: Mapped[dict] = mapped_column(JSONB, nullable=False)
    
    # Storage link
    pdf_s3_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Relationships
    user = relationship("User", backref="invoices")

    def __repr__(self) -> str:
        return f"<Invoice(id={self.id}, number={self.invoice_number}, total={self.total} {self.currency})>"
