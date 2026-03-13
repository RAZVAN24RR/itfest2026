"""
Campaia Engine - Payment Schemas

Pydantic schemas for payment-related operations.
"""

from pydantic import BaseModel, Field


class TokenPackage(BaseModel):
    """Token package available for purchase."""
    id: str
    tokens: int
    price: int
    currency: str
    name: str


class CheckoutSessionCreate(BaseModel):
    """Request to create a Stripe checkout session."""
    package_id: str = Field(..., description="Token package ID to purchase")
    success_url: str = Field(..., description="URL to redirect after success")
    cancel_url: str = Field(..., description="URL to redirect after cancel")


class CheckoutSessionResponse(BaseModel):
    """Response with checkout session URL."""
    checkout_url: str


class WebhookEvent(BaseModel):
    """Stripe webhook event data (simplified)."""
    type: str
    data: dict


class WalletResponse(BaseModel):
    """User's wallet balance."""
    balance: int
    lifetime_purchased: int


class WalletTransactionResponse(BaseModel):
    """A token transaction record."""
    id: str
    amount: int
    type: str
    description: str | None
    action_type: str | None
    created_at: str
