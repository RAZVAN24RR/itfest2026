"""
Campaia Engine - Invoice Schemas

Pydantic models for invoice responses.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class InvoiceResponse(BaseModel):
    """Schema for invoice data in API responses."""
    
    id: UUID
    invoice_number: str
    invoice_type: str
    status: str
    amount: Decimal
    vat: Decimal
    total: Decimal
    currency: str
    issued_at: datetime
    pdf_s3_key: str | None = None
    # Pre-signed URL will be added dynamically in the route if requested
    pdf_url: str | None = None
    
    model_config = ConfigDict(from_attributes=True)


class InvoiceListResponse(BaseModel):
    """Schema for a list of invoices."""
    items: list[InvoiceResponse]
    total: int
