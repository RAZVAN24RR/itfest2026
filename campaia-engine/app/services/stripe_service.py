"""
Campaia Engine - Stripe Service

Handles Stripe integration for payment processing.
"""

import stripe
from stripe import StripeError

from app.core.config import settings


# Configure Stripe
stripe.api_key = settings.stripe_secret_key


# Token packages available for purchase
TOKEN_PACKAGES = [
    {"id": "starter", "tokens": 100, "price": 29, "currency": "ron", "name": "Starter Pack"},
    {"id": "standard", "tokens": 300, "price": 79, "currency": "ron", "name": "Standard Pack"},
    {"id": "pro", "tokens": 700, "price": 149, "currency": "ron", "name": "Pro Pack"},
    {"id": "business", "tokens": 1500, "price": 299, "currency": "ron", "name": "Business Pack"},
]


class StripeService:
    """Service for Stripe payment operations."""

    @staticmethod
    def get_packages() -> list[dict]:
        """Get available token packages."""
        return TOKEN_PACKAGES

    @staticmethod
    def get_package_by_id(package_id: str) -> dict | None:
        """Get a specific package by ID."""
        for package in TOKEN_PACKAGES:
            if package["id"] == package_id:
                return package
        return None

    @staticmethod
    async def create_checkout_session(
        user_id: str,
        user_email: str,
        package_id: str,
        success_url: str,
        cancel_url: str,
    ) -> str:
        """
        Create a Stripe checkout session for purchasing tokens.

        Args:
            user_id: The user's ID
            user_email: The user's email
            package_id: The token package ID
            success_url: URL to redirect after successful payment
            cancel_url: URL to redirect after cancelled payment

        Returns:
            Checkout session URL

        Raises:
            ValueError: If package not found
            StripeError: If Stripe API fails
        """
        package = StripeService.get_package_by_id(package_id)
        if not package:
            raise ValueError(f"Package {package_id} not found")

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": package["currency"],
                        "product_data": {
                            "name": package["name"],
                            "description": f"{package['tokens']} tokens pentru campanii TikTok",
                        },
                        "unit_amount": package["price"] * 100,  # Stripe expects cents
                    },
                    "quantity": 1,
                }],
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=user_email,
                metadata={
                    "user_id": user_id,
                    "package_id": package_id,
                    "tokens": str(package["tokens"]),
                },
            )
            return session.url
        except StripeError as e:
            raise e

    @staticmethod
    def verify_webhook_signature(payload: bytes, signature: str) -> dict | None:
        """
        Verify Stripe webhook signature and return event.

        Args:
            payload: Raw request body
            signature: Stripe signature header

        Returns:
            Stripe event if valid, None otherwise
        """
        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                settings.stripe_webhook_secret,
            )
            return event
        except (ValueError, stripe.error.SignatureVerificationError):
            return None


stripe_service = StripeService()
