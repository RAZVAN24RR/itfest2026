"""
Campaia Engine - Authentication Service

Handles user authentication logic for email/password and Google OAuth.
"""

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import GoogleUserInfo


GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


class AuthService:
    """Service for handling authentication operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_email(self, email: str) -> User | None:
        """Get a user by email address."""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_google_id(self, google_id: str) -> User | None:
        """Get a user by Google ID."""
        result = await self.db.execute(
            select(User).where(User.google_id == google_id)
        )
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: str) -> User | None:
        """Get a user by ID."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def create_user(
        self,
        email: str,
        full_name: str,
        password: str | None = None,
        google_id: str | None = None,
        picture_url: str | None = None,
    ) -> User:
        """Create a new user."""
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password(password) if password else None,
            google_id=google_id,
            picture_url=picture_url,
            is_verified=bool(google_id),  # Google users are pre-verified
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def authenticate_with_password(
        self, email: str, password: str
    ) -> User | None:
        """Authenticate user with email and password."""
        user = await self.get_user_by_email(email)
        if not user:
            return None
        if not user.hashed_password:
            return None  # User registered with Google only
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def authenticate_with_google(
        self, access_token: str
    ) -> tuple[User, str] | None:
        """
        Authenticate user with Google OAuth access token.
        
        Args:
            access_token: Google OAuth access token from frontend
        
        Returns:
            Tuple of (User, JWT token) or None if failed
        """
        # Validate token with Google and get user info
        google_user = await self._get_google_user_info(access_token)
        if not google_user:
            return None

        # Find or create user
        user = await self.get_user_by_google_id(google_user.sub)
        
        if not user:
            # Check if user exists with this email (registered differently)
            user = await self.get_user_by_email(google_user.email)
            
            if user:
                # Link Google account to existing user
                user.google_id = google_user.sub
                if not user.picture_url and google_user.picture:
                    user.picture_url = google_user.picture
                await self.db.commit()
            else:
                # Create new user
                user = await self.create_user(
                    email=google_user.email,
                    full_name=google_user.name,
                    google_id=google_user.sub,
                    picture_url=google_user.picture,
                )

        # Generate JWT token
        token = create_access_token(subject=str(user.id))
        
        return user, token

    async def _get_google_user_info(
        self, access_token: str
    ) -> GoogleUserInfo | None:
        """
        Fetch user info from Google using the access token.
        
        Args:
            access_token: Google OAuth access token
        
        Returns:
            GoogleUserInfo or None if failed
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    GOOGLE_USERINFO_URL,
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10.0,
                )
                
                if response.status_code != 200:
                    return None
                
                data = response.json()
                return GoogleUserInfo(
                    sub=data.get("sub"),
                    email=data.get("email"),
                    name=data.get("name", data.get("given_name", "User")),
                    picture=data.get("picture"),
                    email_verified=data.get("email_verified", True),
                )
        except Exception:
            return None

    def generate_token(self, user: User) -> str:
        """Generate a JWT token for a user."""
        return create_access_token(subject=str(user.id))
