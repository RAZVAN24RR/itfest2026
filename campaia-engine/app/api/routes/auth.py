"""
Campaia Engine - Authentication Routes

Endpoints for user authentication (login, register, Google OAuth).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, DbSession
from app.core.security import hash_password
from app.models.user import User
from app.schemas.auth import AuthResponse, GoogleAuthRequest
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: DbSession,
):
    """
    Register a new user with email and password.
    
    Returns JWT token upon successful registration.
    """
    auth_service = AuthService(db)

    # Check if user already exists
    existing_user = await auth_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    # Create user
    user = await auth_service.create_user(
        email=user_data.email,
        full_name=user_data.full_name,
        password=user_data.password,
    )

    # Generate token
    token = auth_service.generate_token(user)

    return AuthResponse(
        access_token=token,
        user={
            "id": str(user.id),
            "email": user.email,
            "name": user.full_name,
            "picture": user.picture_url,
        },
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: UserLogin,
    db: DbSession,
):
    """
    Login with email and password.
    
    Returns JWT token upon successful authentication.
    """
    auth_service = AuthService(db)

    user = await auth_service.authenticate_with_password(
        credentials.email, credentials.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    token = auth_service.generate_token(user)

    return AuthResponse(
        access_token=token,
        user={
            "id": str(user.id),
            "email": user.email,
            "name": user.full_name,
            "picture": user.picture_url,
        },
    )


@router.post("/google", response_model=AuthResponse)
async def google_auth(
    auth_request: GoogleAuthRequest,
    db: DbSession,
):
    """
    Authenticate with Google OAuth.
    
    Frontend sends the access_token obtained from Google OAuth.
    Backend validates the token, creates/finds the user, and returns a JWT.
    
    This endpoint is called after the frontend successfully
    authenticates with Google and receives an access_token.
    """
    auth_service = AuthService(db)

    result = await auth_service.authenticate_with_google(auth_request.access_token)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token or failed to fetch user info",
        )

    user, token = result

    return AuthResponse(
        access_token=token,
        user={
            "id": str(user.id),
            "email": user.email,
            "name": user.full_name,
            "picture": user.picture_url,
            "sub": user.google_id,  # For frontend compatibility
        },
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: CurrentUser,
):
    """
    Get the current authenticated user's info.
    
    Requires valid JWT token in Authorization header.
    """
    return current_user


@router.post("/logout")
async def logout():
    """
    Logout the current user.
    
    Note: JWT tokens are stateless, so this endpoint is mainly
    for frontend to know the logout was acknowledged.
    For true logout, frontend should remove the stored token.
    """
    return {"message": "Successfully logged out"}
