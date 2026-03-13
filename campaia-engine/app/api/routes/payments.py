"""
Campaia Engine - Payment Routes

API endpoints for payments, wallet, and Stripe integration.
"""

from fastapi import APIRouter, HTTPException, Request, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.payment import (
    CheckoutSessionCreate,
    CheckoutSessionResponse,
    TokenPackage,
    WalletResponse,
    WalletTransactionResponse,
)
from app.services.stripe_service import stripe_service
from app.services.wallet_service import WalletService
from app.services.invoice_service import InvoiceService
from decimal import Decimal

router = APIRouter()


@router.get(
    "/packages",
    response_model=list[TokenPackage],
    summary="Get available token packages",
)
async def get_packages() -> list[TokenPackage]:
    """
    Get all available token packages for purchase.
    
    This endpoint is public and doesn't require authentication.
    """
    packages = stripe_service.get_packages()
    return [TokenPackage(**p) for p in packages]


@router.post(
    "/create-checkout-session",
    response_model=CheckoutSessionResponse,
    summary="Create Stripe checkout session",
)
async def create_checkout_session(
    data: CheckoutSessionCreate,
    user: CurrentUser,
) -> CheckoutSessionResponse:
    """
    Create a Stripe checkout session for purchasing tokens.
    
    Returns a URL to redirect the user to Stripe's hosted checkout page.
    """
    try:
        checkout_url = await stripe_service.create_checkout_session(
            user_id=str(user.id),
            user_email=user.email,
            package_id=data.package_id,
            success_url=data.success_url,
            cancel_url=data.cancel_url,
        )
        return CheckoutSessionResponse(checkout_url=checkout_url)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout session: {str(e)}",
        )


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
    summary="Stripe webhook endpoint",
)
async def stripe_webhook(
    request: Request,
    db: DbSession,
) -> dict:
    """
    Handle Stripe webhook events.
    
    This endpoint receives events from Stripe when payments are completed.
    """
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")

    event = stripe_service.verify_webhook_signature(payload, signature)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        )

    # Handle checkout.session.completed event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})

        user_id = metadata.get("user_id")
        package_id = metadata.get("package_id")
        tokens = int(metadata.get("tokens", 0))

        if user_id and tokens > 0:
            from uuid import UUID

            wallet_service = WalletService(db)
            await wallet_service.add_tokens(
                user_id=UUID(user_id),
                amount=tokens,
                description=f"Purchased {package_id} package",
                stripe_session_id=session.get("id"),
            )
            
            # Generate Invoice automatically
            from app.services.auth_service import AuthService
            auth_service = AuthService(db)
            user = await auth_service.get_user_by_id(user_id)
            if user:
                invoice_service = InvoiceService(db)
                await invoice_service.create_invoice_from_payment(
                    user=user,
                    amount_total_cents=session.get("amount_total", 0),
                    currency=session.get("currency", "ron"),
                    stripe_session_id=session.get("id"),
                    stripe_payment_intent_id=session.get("payment_intent")
                )

    return {"status": "ok"}


@router.post(
    "/verify-session/{session_id}",
    response_model=WalletResponse,
    summary="Verify and complete checkout session",
)
async def verify_session(
    session_id: str,
    user: CurrentUser,
    db: DbSession,
) -> WalletResponse:
    """
    Verify a Stripe checkout session and add tokens if payment was successful.
    This is an alternative to webhooks for development/testing.
    """
    import stripe
    from app.core.config import settings
    
    stripe.api_key = settings.stripe_secret_key
    
    try:
        if session_id.startswith("MOCK_SESSION_") and not settings.stripe_secret_key:
            parts = session_id.split("_")
            package_id = parts[2]
            tokens = int(parts[3])
            
            wallet_service = WalletService(db)
            existing_transactions = await wallet_service.get_transactions(user.id, limit=100)
            for tx in existing_transactions:
                if tx.stripe_session_id == session_id:
                    wallet = await wallet_service.get_or_create_wallet(user.id)
                    return WalletResponse(
                        balance=wallet.balance,
                        lifetime_purchased=wallet.lifetime_purchased,
                    )
                    
            wallet = await wallet_service.add_tokens(
                user_id=user.id,
                amount=tokens,
                description=f"Purchased {package_id} package (MOCK)",
                stripe_session_id=session_id,
            )
            return WalletResponse(
                balance=wallet.balance,
                lifetime_purchased=wallet.lifetime_purchased,
            )

        # Retrieve the session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        # Check if payment was successful
        if session.payment_status != "paid":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment not completed",
            )
        
        # Check if this session was already processed
        wallet_service = WalletService(db)
        existing_transactions = await wallet_service.get_transactions(user.id, limit=100)
        for tx in existing_transactions:
            if tx.stripe_session_id == session_id:
                # Already processed, just return current balance
                wallet = await wallet_service.get_or_create_wallet(user.id)
                return WalletResponse(
                    balance=wallet.balance,
                    lifetime_purchased=wallet.lifetime_purchased,
                )
        
        # Get tokens from metadata
        metadata = session.get("metadata", {})
        tokens = int(metadata.get("tokens", 0))
        package_id = metadata.get("package_id", "unknown")
        
        if tokens <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token amount in session",
            )
        
        # Add tokens to wallet
        wallet = await wallet_service.add_tokens(
            user_id=user.id,
            amount=tokens,
            description=f"Purchased {package_id} package",
            stripe_session_id=session_id,
        )
        
        # Generate Invoice
        invoice_service = InvoiceService(db)
        await invoice_service.create_invoice_from_payment(
            user=user,
            amount_total_cents=session.get("amount_total", 0),
            currency=session.get("currency", "ron"),
            stripe_session_id=session_id,
            stripe_payment_intent_id=session.get("payment_intent")
        )
        
        return WalletResponse(
            balance=wallet.balance,
            lifetime_purchased=wallet.lifetime_purchased,
        )
        
    except stripe.error.InvalidRequestError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify session: {str(e)}",
        )


@router.get(
    "/wallet",
    response_model=WalletResponse,
    summary="Get wallet balance",
)
async def get_wallet(
    user: CurrentUser,
    db: DbSession,
) -> WalletResponse:
    """
    Get current user's wallet balance.
    """
    wallet_service = WalletService(db)
    wallet = await wallet_service.get_or_create_wallet(user.id)

    return WalletResponse(
        balance=wallet.balance,
        lifetime_purchased=wallet.lifetime_purchased,
    )


@router.get(
    "/wallet/transactions",
    response_model=list[WalletTransactionResponse],
    summary="Get wallet transactions",
)
async def get_wallet_transactions(
    user: CurrentUser,
    db: DbSession,
    limit: int = 50,
    offset: int = 0,
) -> list[WalletTransactionResponse]:
    """
    Get user's token transaction history.
    """
    wallet_service = WalletService(db)
    transactions = await wallet_service.get_transactions(user.id, limit, offset)

    return [
        WalletTransactionResponse(
            id=str(t.id),
            amount=t.amount,
            type=t.type,
            description=t.description,
            action_type=t.action_type,
            created_at=t.created_at.isoformat(),
        )
        for t in transactions
    ]
