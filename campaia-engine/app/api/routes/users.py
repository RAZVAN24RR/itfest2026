"""
Campaia Engine - User Routes

Endpoints for user profile management.
"""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import update

from app.api.deps import CurrentUser, DbSession
from app.models.user import User, UserType
from app.schemas.profile import (
    BusinessDetails,
    ProfileCompletionStatus,
    ProfileResponse,
    ProfileUpdate,
)

router = APIRouter()


@router.get("/me", response_model=ProfileResponse)
async def get_current_user_profile(
    current_user: CurrentUser,
):
    """
    Get the current user's full profile.
    
    Returns all profile information including business details if applicable.
    """
    return ProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        picture_url=current_user.picture_url,
        user_type=UserType(current_user.user_type),
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        profile_completed=current_user.profile_completed,
        phone=current_user.phone,
        company_name=current_user.company_name,
        cui=current_user.cui,
        reg_com=current_user.reg_com,
        address=current_user.address,
        city=current_user.city,
        county=current_user.county,
        country=current_user.country,
    )


@router.patch("/me", response_model=ProfileResponse)
async def update_current_user_profile(
    profile_data: ProfileUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Update the current user's profile.
    
    Only provided fields will be updated. Null values in request body
    are ignored (use explicit empty string to clear a field).
    """
    # Build update data, excluding None values
    update_data = profile_data.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    # If changing to BUSINESS, ensure required fields are provided
    if update_data.get("user_type") == UserType.BUSINESS:
        # Check if business fields are already set or being set
        required_business_fields = ["company_name", "cui", "address", "city", "county"]
        for field in required_business_fields:
            current_value = getattr(current_user, field)
            new_value = update_data.get(field)
            if not current_value and not new_value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Field '{field}' is required for BUSINESS accounts",
                )

    # Update user
    for field, value in update_data.items():
        setattr(current_user, field, value)

    # Check if profile is now complete
    current_user.profile_completed = _check_profile_complete(current_user)

    await db.commit()
    await db.refresh(current_user)

    return await get_current_user_profile(current_user)


@router.get("/me/completion", response_model=ProfileCompletionStatus)
async def get_profile_completion_status(
    current_user: CurrentUser,
):
    """
    Check the profile completion status.
    
    Returns whether the profile is complete and which fields are missing.
    """
    missing_fields = []
    total_fields = 3  # full_name, phone are basic required fields
    completed_fields = 0

    # Basic fields
    if current_user.full_name:
        completed_fields += 1
    else:
        missing_fields.append("full_name")

    if current_user.phone:
        completed_fields += 1
    else:
        missing_fields.append("phone")

    # User type specific fields
    if current_user.user_type == UserType.BUSINESS.value:
        total_fields += 5  # company_name, cui, address, city, county
        
        if current_user.company_name:
            completed_fields += 1
        else:
            missing_fields.append("company_name")
            
        if current_user.cui:
            completed_fields += 1
        else:
            missing_fields.append("cui")
            
        if current_user.address:
            completed_fields += 1
        else:
            missing_fields.append("address")
            
        if current_user.city:
            completed_fields += 1
        else:
            missing_fields.append("city")
            
        if current_user.county:
            completed_fields += 1
        else:
            missing_fields.append("county")

    # Calculate percentage
    percentage = int((completed_fields / total_fields) * 100) if total_fields > 0 else 0

    return ProfileCompletionStatus(
        is_complete=len(missing_fields) == 0,
        missing_fields=missing_fields,
        percentage=percentage,
    )


@router.post("/me/business", response_model=ProfileResponse)
async def set_business_details(
    business_data: BusinessDetails,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Set business details and upgrade account to BUSINESS type.
    
    This endpoint sets all required business fields and changes
    the user type to BUSINESS.
    """
    # Update all business fields
    current_user.user_type = UserType.BUSINESS.value
    current_user.company_name = business_data.company_name
    current_user.cui = business_data.cui
    current_user.reg_com = business_data.reg_com
    current_user.address = business_data.address
    current_user.city = business_data.city
    current_user.county = business_data.county
    current_user.country = business_data.country

    # Check completion
    current_user.profile_completed = _check_profile_complete(current_user)

    await db.commit()
    await db.refresh(current_user)

    return await get_current_user_profile(current_user)


def _check_profile_complete(user: User) -> bool:
    """Check if user profile is complete based on user type."""
    # Basic fields required for all
    if not user.full_name or not user.phone:
        return False

    # Business-specific fields
    if user.user_type == UserType.BUSINESS.value:
        if not all([
            user.company_name,
            user.cui,
            user.address,
            user.city,
            user.county,
        ]):
            return False

    return True
