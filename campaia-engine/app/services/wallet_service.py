"""
Campaia Engine - Wallet Service

Business logic for wallet and token operations.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.token_transaction import TokenTransaction, TransactionType, ActionType
from app.models.user import User
from app.models.wallet import Wallet


class InsufficientBalanceError(Exception):
    """Raised when user doesn't have enough tokens."""
    pass


class WalletNotFoundError(Exception):
    """Raised when wallet doesn't exist."""
    pass


class WalletService:
    """Service for wallet and token operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_wallet(self, user_id: UUID) -> Wallet:
        """
        Get user's wallet or create one if it doesn't exist.

        Args:
            user_id: The user's ID

        Returns:
            The user's wallet
        """
        result = await self.db.execute(
            select(Wallet).where(Wallet.user_id == user_id)
        )
        wallet = result.scalar_one_or_none()

        if not wallet:
            wallet = Wallet(user_id=user_id, balance=0, lifetime_purchased=0)
            self.db.add(wallet)
            await self.db.commit()
            await self.db.refresh(wallet)

        return wallet

    async def get_balance(self, user_id: UUID) -> int:
        """
        Get user's token balance.

        Args:
            user_id: The user's ID

        Returns:
            Current token balance
        """
        wallet = await self.get_or_create_wallet(user_id)
        return wallet.balance

    async def add_tokens(
        self,
        user_id: UUID,
        amount: int,
        description: str,
        action_type: str = ActionType.PURCHASE.value,
        stripe_session_id: str | None = None,
    ) -> Wallet:
        """
        Add tokens to user's wallet.

        Args:
            user_id: The user's ID
            amount: Number of tokens to add
            description: Description of the transaction
            action_type: Type of action (PURCHASE, BONUS, etc.)
            stripe_session_id: Optional Stripe session ID

        Returns:
            Updated wallet
        """
        wallet = await self.get_or_create_wallet(user_id)
        wallet.balance += amount

        if action_type == ActionType.PURCHASE.value:
            wallet.lifetime_purchased += amount

        # Create transaction record
        transaction = TokenTransaction(
            user_id=user_id,
            amount=amount,
            type=TransactionType.PURCHASE.value,
            description=description,
            action_type=action_type,
            stripe_session_id=stripe_session_id,
        )
        self.db.add(transaction)

        await self.db.commit()
        await self.db.refresh(wallet)

        return wallet

    async def spend_tokens(
        self,
        user_id: UUID,
        amount: int,
        description: str,
        action_type: str,
    ) -> Wallet:
        """
        Spend tokens from user's wallet.

        Args:
            user_id: The user's ID
            amount: Number of tokens to spend
            description: Description of the transaction
            action_type: Type of action (SCRIPT, IMAGE, VIDEO, etc.)

        Returns:
            Updated wallet

        Raises:
            InsufficientBalanceError: If user doesn't have enough tokens
        """
        wallet = await self.get_or_create_wallet(user_id)

        if wallet.balance < amount:
            raise InsufficientBalanceError(
                f"Insufficient balance. Required: {amount}, Available: {wallet.balance}"
            )

        wallet.balance -= amount

        # Create transaction record (negative amount for spending)
        transaction = TokenTransaction(
            user_id=user_id,
            amount=-amount,
            type=TransactionType.SPEND.value,
            description=description,
            action_type=action_type,
        )
        self.db.add(transaction)

        await self.db.commit()
        await self.db.refresh(wallet)

        return wallet

    async def check_balance(self, user_id: UUID, required: int) -> bool:
        """
        Check if user has enough tokens.

        Args:
            user_id: The user's ID
            required: Required number of tokens

        Returns:
            True if user has enough tokens
        """
        wallet = await self.get_or_create_wallet(user_id)
        return wallet.balance >= required

    async def get_transactions(
        self,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> list[TokenTransaction]:
        """
        Get user's transaction history.

        Args:
            user_id: The user's ID
            limit: Maximum number of transactions to return
            offset: Offset for pagination

        Returns:
            List of transactions
        """
        result = await self.db.execute(
            select(TokenTransaction)
            .where(TokenTransaction.user_id == user_id)
            .order_by(TokenTransaction.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def refund_tokens(
        self,
        user_id: UUID,
        amount: int,
        description: str,
        stripe_session_id: str | None = None,
    ) -> Wallet:
        """
        Refund tokens to user's wallet.

        Args:
            user_id: The user's ID
            amount: Number of tokens to refund
            description: Description of the refund
            stripe_session_id: Optional Stripe session ID

        Returns:
            Updated wallet
        """
        wallet = await self.get_or_create_wallet(user_id)
        wallet.balance += amount

        # Create transaction record
        transaction = TokenTransaction(
            user_id=user_id,
            amount=amount,
            type=TransactionType.REFUND.value,
            description=description,
            action_type=ActionType.PURCHASE.value,
            stripe_session_id=stripe_session_id,
        )
        self.db.add(transaction)

        await self.db.commit()
        await self.db.refresh(wallet)

        return wallet
