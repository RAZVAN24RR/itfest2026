"""Video generation API — multi-provider + Kling fallback."""

import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException, status, UploadFile, File
from pydantic import BaseModel

from app.api.deps import CurrentUser, DbSession
from app.models.video_generation import VideoQuality, VideoDuration, VideoStatus
from app.services.video_service import video_service
from app.services.wallet_service import WalletService
from app.services.video_providers.base import VideoProviderId, PROVIDER_LABELS, provider_token_multiplier
from app.schemas.video import (
    VideoGenerateRequest,
    VideoGenerateResponse,
    VideoStatusResponse,
    VideoListResponse,
    VideoListItem,
    VideoStatusEnum,
    VideoDurationEnum,
    VideoQualityEnum,
    VideoProviderEnum,
    VideoUploadResponse,
    get_video_cost_with_provider,
    VideoProviderInfo,
)

router = APIRouter(prefix="/video", tags=["video"])


def _item(v) -> VideoListItem:
    return VideoListItem(
        id=str(v.id),
        status=VideoStatusEnum(v.status.value),
        video_url=v.video_url,
        thumbnail_url=v.thumbnail_url,
        duration=v.duration.value,
        quality=v.quality.value,
        prompt=v.prompt[:100] + "..." if len(v.prompt) > 100 else v.prompt,
        tokens_spent=v.tokens_spent,
        created_at=v.created_at.isoformat(),
        campaign_id=str(v.campaign_id) if v.campaign_id else None,
        user_id=str(v.user_id) if getattr(v, "user_id", None) else None,
        title=v.title,
        provider_requested=getattr(v, "video_provider", None) or "KLING",
        provider_used=getattr(v, "provider_used", None),
        fallback_used=bool(getattr(v, "fallback_used", False)),
        aspect_ratio=getattr(v, "aspect_ratio", None) or "9:16",
    )


@router.get("/providers")
async def list_video_providers(current_user: CurrentUser):
    """UX-facing generation styles + token multipliers."""
    out = []
    for p in (
        VideoProviderId.KLING,
        VideoProviderId.RUNWAY,
        VideoProviderId.PIKA,
        VideoProviderId.STABLE_VIDEO,
    ):
        out.append(
            VideoProviderInfo(
                id=p.value,
                label=PROVIDER_LABELS[p],
                description=PROVIDER_LABELS[p],
                token_multiplier=provider_token_multiplier(p),
            )
        )
    return {"providers": out}


@router.get("/list", response_model=VideoListResponse)
async def list_videos(
    db: DbSession,
    current_user: CurrentUser,
    campaign_id: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
):
    campaign_uuid = None
    if campaign_id:
        try:
            campaign_uuid = uuid.UUID(campaign_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid campaign_id")
    videos = await video_service.get_user_videos(
        db=db,
        user_id=current_user.id,
        campaign_id=campaign_uuid,
        limit=min(limit, 50),
        offset=offset,
    )
    return VideoListResponse(videos=[_item(v) for v in videos], total=len(videos))


@router.get("/feed", response_model=VideoListResponse)
async def get_video_feed(db: DbSession, limit: int = 20, offset: int = 0):
    videos = await video_service.get_public_videos(
        db=db, limit=min(limit, 50), offset=offset
    )
    return VideoListResponse(videos=[_item(v) for v in videos], total=len(videos))


@router.get("/cost")
async def get_video_cost(
    duration: VideoDurationEnum = VideoDurationEnum.SHORT,
    quality: VideoQualityEnum = VideoQualityEnum.STANDARD,
    provider: VideoProviderEnum = VideoProviderEnum.KLING,
):
    cost = get_video_cost_with_provider(
        duration.value, quality.value, provider.value
    )
    return {
        "duration": duration.value,
        "quality": quality.value,
        "provider": provider.value,
        "tokens": cost,
        "description": f"AI Video {duration.value}s {quality.value} ({provider.value})",
    }


@router.get("/status/kling")
async def check_kling_status(current_user: CurrentUser):
    available = await video_service.check_kling_available()
    return {
        "provider": "Kling AI",
        "available": available,
        "models": ["kling-v1-6"],
        "features": ["text2video", "image2video", "multi_provider_fallback"],
    }


@router.post("/generate", response_model=VideoGenerateResponse)
async def generate_video(
    request: VideoGenerateRequest,
    db: DbSession,
    current_user: CurrentUser,
):
    duration = (
        VideoDuration.SHORT
        if request.duration == VideoDurationEnum.SHORT
        else VideoDuration.LONG
    )
    quality = (
        VideoQuality.STANDARD
        if request.quality == VideoQualityEnum.STANDARD
        else VideoQuality.PROFESSIONAL
    )
    try:
        provider = VideoProviderId(request.provider.value)
    except ValueError:
        provider = VideoProviderId.KLING
    token_cost = get_video_cost_with_provider(
        duration.value, quality.value, provider.value
    )
    wallet_svc = WalletService(db)
    balance = await wallet_svc.get_balance(current_user.id)
    if balance < token_cost:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": "Insufficient tokens for video generation",
                "required": token_cost,
                "available": balance,
            },
        )
    campaign_uuid = None
    if request.campaign_id:
        try:
            campaign_uuid = uuid.UUID(request.campaign_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid campaign_id",
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
            provider=provider,
        )
        est = 60 + (60 if quality == VideoQuality.PROFESSIONAL else 0)
        est += 60 if duration == VideoDuration.LONG else 0
        if provider != VideoProviderId.KLING:
            est += 30
        msg = "Video generation started. Poll /video/{id}/status."
        if provider != VideoProviderId.KLING:
            msg += " If your style is unavailable, we fall back to fast generation."
        return VideoGenerateResponse(
            id=str(video_job.id),
            status=VideoStatusEnum.PENDING,
            estimated_time_seconds=est,
            tokens_cost=token_cost,
            message=msg,
            provider_requested=provider.value,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/{video_id}/status", response_model=VideoStatusResponse)
async def get_video_status(
    video_id: str,
    db: DbSession,
    current_user: CurrentUser,
):
    try:
        video_uuid = uuid.UUID(video_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid video_id")
    video_job = await video_service.get_video_status(
        db=db, video_id=video_uuid, user_id=current_user.id
    )
    if not video_job:
        raise HTTPException(status_code=404, detail="Video not found")
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
        provider_requested=getattr(video_job, "video_provider", None) or "KLING",
        provider_used=video_job.provider_used,
        fallback_used=bool(getattr(video_job, "fallback_used", False)),
        aspect_ratio=getattr(video_job, "aspect_ratio", None) or "9:16",
    )


@router.post("/upload", response_model=VideoUploadResponse)
async def upload_video(
    db: DbSession,
    current_user: CurrentUser,
    file: UploadFile = File(...),
    title: Optional[str] = None,
    campaign_id: Optional[str] = None,
    is_public: bool = True,
):
    allowed = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Invalid file type")
    content = await file.read()
    if len(content) > 100 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")
    campaign_uuid = None
    if campaign_id:
        try:
            campaign_uuid = uuid.UUID(campaign_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid campaign_id")
    try:
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
            file_size_bytes=video_record.file_size_bytes or len(content),
            duration_seconds=None,
            message="Video uploaded successfully",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class VideoTitleBody(BaseModel):
    title: str


@router.patch("/{video_id}/title")
async def patch_video_title(
    video_id: str,
    db: DbSession,
    current_user: CurrentUser,
    body: VideoTitleBody,
):
    t = body
    try:
        vid = uuid.UUID(video_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid video_id")
    v = await video_service.update_video_title(
        db, vid, current_user.id, t.title
    )
    if not v:
        raise HTTPException(status_code=404, detail="Not found")
    return {"id": str(v.id), "title": v.title}


@router.delete("/{video_id}")
async def delete_video(
    video_id: str,
    db: DbSession,
    current_user: CurrentUser,
):
    try:
        video_uuid = uuid.UUID(video_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid video_id")
    ok = await video_service.delete_video(
        db=db, video_id=video_uuid, user_id=current_user.id
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Video not found")
    return {"status": "success"}
