"""
Campaia Engine - Video Generation API Routes

Endpoints for AI video generation with Kling AI.
"""

import uuid
import os
import tempfile
from typing import Optional

from fastapi import APIRouter, HTTPException, status, UploadFile, File

from app.api.deps import CurrentUser, DbSession
from app.models.video_generation import VideoQuality, VideoDuration, VideoStatus
from app.services.video_service import video_service
from app.services.wallet_service import WalletService
from app.schemas.video import (
    VideoGenerateRequest,
    VideoGenerateResponse,
    VideoStatusResponse,
    VideoListResponse,
    VideoListItem,
    VideoStatusEnum,
    VideoDurationEnum,
    VideoQualityEnum,
    VideoUploadResponse,
    get_video_token_cost,
)


router = APIRouter(prefix="/video", tags=["video"])


# ==========================================
# VIDEO GENERATION
# ==========================================

@router.post("/generate", response_model=VideoGenerateResponse)
async def generate_video(
    request: VideoGenerateRequest,
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Generate a TikTok ad video using Kling AI.
    
    This initiates video generation which runs asynchronously.
    Poll the /video/{id}/status endpoint to check progress.
    
    Token costs:
    - 5s Standard: 50 tokens
    - 5s Professional: 80 tokens
    - 10s Standard: 80 tokens
    - 10s Professional: 150 tokens
    """
    # Map request enums to model enums
    duration = VideoDuration.SHORT if request.duration == VideoDurationEnum.SHORT else VideoDuration.LONG
    quality = VideoQuality.STANDARD if request.quality == VideoQualityEnum.STANDARD else VideoQuality.PROFESSIONAL
    
    # Calculate cost
    token_cost = get_video_token_cost(duration.value, quality.value)
    
    # Check balance
    wallet_svc = WalletService(db)
    balance = await wallet_svc.get_balance(current_user.id)
    if balance < token_cost:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": "Insufficient tokens for video generation",
                "required": token_cost,
                "available": balance,
            }
        )
    
    # Parse campaign_id if provided
    campaign_uuid = None
    if request.campaign_id:
        try:
            campaign_uuid = uuid.UUID(request.campaign_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid campaign_id format"
            )
    
    try:
        video_job = await video_service.create_video_job(
            db=db,
            user=current_user,
            prompt=request.prompt,
            script=request.script,
            campaign_id=campaign_uuid,
            duration=duration,
            quality=quality,
        )
        
        # Estimate time based on quality and duration
        estimated_time = 60  # Base 1 minute
        if quality == VideoQuality.PROFESSIONAL:
            estimated_time += 60
        if duration == VideoDuration.LONG:
            estimated_time += 60
        
        return VideoGenerateResponse(
            id=str(video_job.id),
            status=VideoStatusEnum.PENDING,
            estimated_time_seconds=estimated_time,
            tokens_cost=token_cost,
            message="Video generation started. Poll /video/{id}/status to check progress.",
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start video generation: {str(e)}"
        )


# ==========================================
# VIDEO STATUS
# ==========================================

@router.get("/{video_id}/status", response_model=VideoStatusResponse)
async def get_video_status(
    video_id: str,
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Get the status of a video generation job.
    
    Poll this endpoint to check progress until status is COMPLETED or FAILED.
    """
    try:
        video_uuid = uuid.UUID(video_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid video_id format"
        )
    
    video_job = await video_service.get_video_status(
        db=db,
        video_id=video_uuid,
        user_id=current_user.id,
    )
    
    if not video_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    return VideoStatusResponse(
        id=str(video_job.id),
        status=VideoStatusEnum(video_job.status.value),
        progress_percent=video_job.progress_percent,
        video_url=video_job.video_url,
        thumbnail_url=video_job.thumbnail_url,
        error_message=video_job.error_message,
        duration=video_job.duration.value,
        quality=video_job.quality.value,
        tokens_spent=video_job.tokens_spent,
        created_at=video_job.created_at.isoformat(),
    )


# ==========================================
# VIDEO LIST
# ==========================================

@router.get("/list", response_model=VideoListResponse)
async def list_videos(
    db: DbSession,
    current_user: CurrentUser,
    campaign_id: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
):
    """
    List user's generated videos.
    
    Optionally filter by campaign_id.
    """
    campaign_uuid = None
    if campaign_id:
        try:
            campaign_uuid = uuid.UUID(campaign_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid campaign_id format"
            )
    
    videos = await video_service.get_user_videos(
        db=db,
        user_id=current_user.id,
        campaign_id=campaign_uuid,
        limit=min(limit, 50),  # Cap at 50
        offset=offset,
    )
    
    items = [
        VideoListItem(
            id=str(video.id),
            status=VideoStatusEnum(video.status.value),
            video_url=video.video_url,
            thumbnail_url=video.thumbnail_url,
            duration=video.duration.value,
            quality=video.quality.value,
            prompt=video.prompt[:100] + "..." if len(video.prompt) > 100 else video.prompt,
            tokens_spent=video.tokens_spent,
            created_at=video.created_at.isoformat(),
            campaign_id=str(video.campaign_id) if video.campaign_id else None,
        )
        for video in videos
    ]
    
    return VideoListResponse(
        videos=items,
        total=len(items),
    )


@router.get("/feed", response_model=VideoListResponse)
async def get_video_feed(
    db: DbSession,
    limit: int = 20,
    offset: int = 0,
):
    """
    Get public community video feed.
    """
    videos = await video_service.get_public_videos(
        db=db,
        limit=min(limit, 50),
        offset=offset,
    )
    
    items = [
        VideoListItem(
            id=str(video.id),
            status=VideoStatusEnum.COMPLETED,
            video_url=video.video_url,
            thumbnail_url=video.thumbnail_url,
            duration=video.duration.value,
            quality=video.quality.value,
            prompt=video.prompt[:100] + "..." if len(video.prompt) > 100 else video.prompt,
            tokens_spent=video.tokens_spent,
            created_at=video.created_at.isoformat(),
            campaign_id=str(video.campaign_id) if video.campaign_id else None,
            user_id=str(video.user_id),  # Include user ID for feed
        )
        for video in videos
    ]
    
    return VideoListResponse(
        videos=items,
        total=len(items),
    )


# ==========================================
# VIDEO TOKEN COST
# ==========================================

@router.get("/cost")
async def get_video_cost(
    duration: VideoDurationEnum = VideoDurationEnum.SHORT,
    quality: VideoQualityEnum = VideoQualityEnum.STANDARD,
):
    """
    Get token cost for video generation.
    
    Use this to display costs before generation.
    """
    cost = get_video_token_cost(duration.value, quality.value)
    
    return {
        "duration": duration.value,
        "quality": quality.value,
        "tokens": cost,
        "description": f"AI Video {duration.value}s {quality.value}",
    }


# ==========================================
# KLING AI STATUS
# ==========================================

@router.get("/status/kling")
async def check_kling_status(
    current_user: CurrentUser,
):
    """
    Check if Kling AI service is available.
    """
    available = await video_service.check_kling_available()
    
    return {
        "provider": "Kling AI",
        "available": available,
        "models": ["kling-v1", "kling-v1-5", "kling-v1-6", "kling-v2", "kling-v2-1"],
        "features": ["text2video", "image2video"],
    }


# ==========================================
# VIDEO UPLOAD (User uploaded videos)
# ==========================================

@router.post("/upload", response_model=VideoUploadResponse)
async def upload_video(
    db: DbSession,
    current_user: CurrentUser,
    file: UploadFile = File(...),
    title: Optional[str] = None,
    campaign_id: Optional[str] = None,
    is_public: bool = True,
):
    """
    Upload a user video file (from gallery, camera recording, etc.).
    
    Accepts video files (MP4, WebM, MOV) up to 100MB.
    Videos are stored in S3 and tracked in the database.
    """
    # Validate file type
    allowed_types = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: MP4, WebM, MOV. Got: {file.content_type}"
        )
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Validate file size (100MB max)
    max_size = 100 * 1024 * 1024  # 100MB
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: 100MB. Got: {file_size / (1024*1024):.1f}MB"
        )
    
    # Parse campaign_id if provided
    campaign_uuid = None
    if campaign_id:
        try:
            campaign_uuid = uuid.UUID(campaign_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid campaign_id format"
            )
    
    try:
        # Use video service to upload
        video_record = await video_service.upload_user_video(
            db=db,
            user=current_user,
            file_content=content,
            filename=file.filename or "video.mp4",
            content_type=file.content_type,
            title=title,
            campaign_id=campaign_uuid,
            is_public=is_public,
        )
        
        return VideoUploadResponse(
            id=str(video_record.id),
            video_url=video_record.video_url,
            thumbnail_url=video_record.thumbnail_url,
            file_size_bytes=video_record.file_size_bytes or file_size,
            duration_seconds=None,  # Could be extracted with ffprobe
            message="Video uploaded successfully",
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload video: {str(e)}"
        )
@router.delete("/{video_id}")
async def delete_video(
    video_id: str,
    db: DbSession,
    current_user: CurrentUser,
):
    """Delete a video."""
    try:
        video_uuid = uuid.UUID(video_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid video_id format"
        )
    
    success = await video_service.delete_video(
        db=db,
        video_id=video_uuid,
        user_id=current_user.id,
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    return {"status": "success", "message": "Video deleted"}
