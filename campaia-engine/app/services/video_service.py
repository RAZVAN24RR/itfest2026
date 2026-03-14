"""
Video generation: multi-provider orchestration, Kling fallback, 9:16 for TikTok.
"""

import uuid
import asyncio
import logging
import time
from typing import Optional

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.video_generation import (
    VideoGeneration,
    VideoStatus,
    VideoQuality,
    VideoDuration,
)
from app.models.user import User
from app.services.kling.kling_client import (
    kling_client,
    KlingModel,
    KlingMode,
    KlingDuration as KlingDurationEnum,
    KlingAspectRatio,
)
from app.services.wallet_service import WalletService
from app.schemas.video import get_video_cost_with_provider
from app.core.database import async_session_maker
from app.services.video_providers.base import VideoProviderId
from app.services.video_providers.alternate import try_alternate_generation, AlternateProviderError

logger = logging.getLogger(__name__)


class VideoGenerationService:
    QUALITY_TO_KLING_MODE = {
        VideoQuality.STANDARD: KlingMode.STANDARD,
        VideoQuality.PROFESSIONAL: KlingMode.PROFESSIONAL,
    }
    DURATION_TO_KLING = {
        VideoDuration.SHORT: KlingDurationEnum.SHORT,
        VideoDuration.LONG: KlingDurationEnum.LONG,
    }

    async def create_video_job(
        self,
        db: AsyncSession,
        user: User,
        prompt: str,
        script: Optional[str] = None,
        campaign_id: Optional[uuid.UUID] = None,
        duration: VideoDuration = VideoDuration.SHORT,
        quality: VideoQuality = VideoQuality.STANDARD,
        provider: VideoProviderId = VideoProviderId.KLING,
    ) -> VideoGeneration:
        token_cost = get_video_cost_with_provider(
            duration.value, quality.value, provider.value
        )
        wallet_svc = WalletService(db)
        balance = await wallet_svc.get_balance(user.id)
        if balance < token_cost:
            raise ValueError(
                f"Insufficient tokens. Required: {token_cost}, Available: {balance}"
            )
        await wallet_svc.spend_tokens(
            user_id=user.id,
            amount=token_cost,
            description=f"AI Video ({provider.value}, {duration.value}s {quality.value})",
            action_type="VIDEO_GENERATION",
        )
        video_job = VideoGeneration(
            user_id=user.id,
            campaign_id=campaign_id,
            prompt=prompt,
            script=script,
            duration=duration,
            quality=quality,
            video_provider=provider.value,
            provider_used=None,
            fallback_used=False,
            aspect_ratio="9:16",
            status=VideoStatus.PENDING,
            tokens_spent=token_cost,
            progress_percent=0,
        )
        db.add(video_job)
        await db.commit()
        await db.refresh(video_job)
        asyncio.create_task(self._process_video_generation_task(video_job.id))
        return video_job

    async def _process_video_generation_task(self, video_id: uuid.UUID) -> None:
        try:
            async with async_session_maker() as db:
                await self._process_video_generation(db, video_id)
        except Exception as e:
            logger.error("Background video generation failed for %s: %s", video_id, e)
            try:
                async with async_session_maker() as db:
                    result = await db.execute(
                        select(VideoGeneration).where(VideoGeneration.id == video_id)
                    )
                    video_job = result.scalar_one_or_none()
                    if video_job and video_job.status not in [
                        VideoStatus.COMPLETED,
                        VideoStatus.FAILED,
                    ]:
                        video_job.status = VideoStatus.FAILED
                        video_job.error_message = str(e)[:500]
                        tokens_to_refund = video_job.tokens_spent
                        await db.commit()
                        if tokens_to_refund > 0:
                            wallet_svc = WalletService(db)
                            await wallet_svc.add_tokens(
                                user_id=video_job.user_id,
                                amount=tokens_to_refund,
                                description=f"Refund failed video {video_id}",
                                action_type="REFUND",
                            )
            except Exception as inner_e:
                logger.error("Refund failed: %s", inner_e)

    async def _run_kling_pipeline(
        self,
        db: AsyncSession,
        video_job: VideoGeneration,
    ) -> None:
        kling_mode = self.QUALITY_TO_KLING_MODE[video_job.quality]
        kling_duration = self.DURATION_TO_KLING[video_job.duration]
        response = await kling_client.text_to_video(
            prompt=video_job.prompt,
            model=KlingModel.V1_6,
            mode=kling_mode,
            duration=kling_duration,
            aspect_ratio=KlingAspectRatio.RATIO_9_16,
        )
        task_id = response.get("data", {}).get("task_id")
        if not task_id:
            raise RuntimeError(f"No task_id in Kling response: {response}")
        video_job.kling_task_id = task_id
        video_job.progress_percent = 30
        await db.commit()
        final_status = await kling_client.wait_for_video(
            task_id=task_id,
            is_image_to_video=False,
            timeout_seconds=900,
            poll_interval=10,
        )
        video_job.progress_percent = 80
        await db.commit()
        videos = final_status.get("data", {}).get("task_result", {}).get("videos", [])
        if not videos:
            raise RuntimeError(f"No videos in Kling response: {final_status}")
        kling_video_url = videos[0].get("url")
        if not kling_video_url:
            raise RuntimeError("No video URL in Kling response")
        video_job.status = VideoStatus.UPLOADING
        video_job.progress_percent = 85
        await db.commit()
        async with httpx.AsyncClient(timeout=120.0) as client:
            video_response = await client.get(kling_video_url)
            video_response.raise_for_status()
            video_data = video_response.content
        s3_key = f"videos/{video_job.user_id}/{video_job.id}/video.mp4"
        video_job.video_url = kling_video_url
        video_job.s3_key = s3_key
        video_job.file_size_bytes = len(video_data)
        video_job.width = 1080
        video_job.height = 1920
        video_job.status = VideoStatus.COMPLETED
        video_job.progress_percent = 100
        await db.commit()

    async def _process_video_generation(
        self,
        db: AsyncSession,
        video_id: uuid.UUID,
    ) -> None:
        result = await db.execute(
            select(VideoGeneration).where(VideoGeneration.id == video_id)
        )
        video_job = result.scalar_one_or_none()
        if not video_job:
            return
        t0 = time.perf_counter()
        requested = VideoProviderId.KLING
        try:
            requested = VideoProviderId(video_job.video_provider)
        except ValueError:
            requested = VideoProviderId.KLING

        try:
            video_job.status = VideoStatus.PROCESSING
            video_job.progress_percent = 10
            await db.commit()

            if requested == VideoProviderId.KLING:
                video_job.provider_used = VideoProviderId.KLING.value
                await db.commit()
                await self._run_kling_pipeline(db, video_job)
            else:
                last_err = None
                video_bytes = None
                for attempt in (1, 2):
                    try:
                        result = await try_alternate_generation(
                            requested, video_job.prompt, attempt=attempt
                        )
                        if isinstance(result, bytes) and len(result) > 0:
                            video_bytes = result
                            break
                    except AlternateProviderError as e:
                        last_err = e
                        logger.info(
                            "Alternate %s attempt %s: %s", requested, attempt, e
                        )
                if video_bytes:
                    video_job.provider_used = requested.value
                    video_job.fallback_used = False
                    await db.commit()
                    await self._save_local_video(db, video_job, video_bytes)
                else:
                    video_job.fallback_used = True
                    video_job.provider_used = VideoProviderId.KLING.value
                    await db.commit()
                    await self._run_kling_pipeline(db, video_job)

            video_job.generation_duration_ms = int(
                (time.perf_counter() - t0) * 1000
            )
            if video_job.status == VideoStatus.COMPLETED:
                video_job.error_message = None
                if video_job.fallback_used:
                    video_job.error_message = (
                        "Your chosen style was unavailable; we used fast generation instead."
                    )[:500]
            await db.commit()
            logger.info("Video %s completed provider_used=%s", video_id, video_job.provider_used)
        except Exception as e:
            logger.error("Video generation failed: %s", e)
            video_job.status = VideoStatus.FAILED
            video_job.error_message = str(e)[:500]
            tokens_to_refund = video_job.tokens_spent
            await db.commit()
            if tokens_to_refund > 0:
                try:
                    wallet_svc = WalletService(db)
                    await wallet_svc.add_tokens(
                        user_id=video_job.user_id,
                        amount=tokens_to_refund,
                        description=f"Refund failed video {video_id}",
                        action_type="REFUND",
                    )
                except Exception as re:
                    logger.error("Refund error: %s", re)

    async def _save_local_video(
        self,
        db: AsyncSession,
        video_job: VideoGeneration,
        video_bytes: bytes,
    ) -> None:
        """Store locally-generated video bytes via S3 (same as Kling upload)."""
        import boto3, os
        s3_endpoint = os.getenv("AWS_ENDPOINT_URL", "http://localhost:4566")
        s3_bucket = os.getenv("S3_BUCKET_MEDIA", "campaia-dev-media")
        aws_region = os.getenv("AWS_REGION", "eu-central-1")
        s3_client = boto3.client(
            "s3",
            endpoint_url=s3_endpoint,
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "test"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "test"),
            region_name=aws_region,
        )
        try:
            s3_client.head_bucket(Bucket=s3_bucket)
        except Exception:
            try:
                s3_client.create_bucket(
                    Bucket=s3_bucket,
                    CreateBucketConfiguration={"LocationConstraint": aws_region},
                )
            except Exception:
                pass
        s3_key = f"videos/{video_job.user_id}/{video_job.id}/video.mp4"
        s3_client.put_object(
            Bucket=s3_bucket, Key=s3_key, Body=video_bytes, ContentType="video/mp4"
        )
        if "localhost" in s3_endpoint or "localstack" in s3_endpoint:
            video_url = f"{s3_endpoint}/{s3_bucket}/{s3_key}"
        else:
            video_url = f"https://{s3_bucket}.s3.{aws_region}.amazonaws.com/{s3_key}"
        video_job.video_url = video_url
        video_job.s3_key = s3_key
        video_job.file_size_bytes = len(video_bytes)
        video_job.width = 256
        video_job.height = 256
        video_job.status = VideoStatus.COMPLETED
        video_job.progress_percent = 100
        await db.commit()
        logger.info("Local video saved to S3: %s", s3_key)

    async def get_video_status(
        self,
        db: AsyncSession,
        video_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Optional[VideoGeneration]:
        result = await db.execute(
            select(VideoGeneration).where(
                VideoGeneration.id == video_id,
                VideoGeneration.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_user_videos(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        campaign_id: Optional[uuid.UUID] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[VideoGeneration]:
        query = select(VideoGeneration).where(VideoGeneration.user_id == user_id)
        if campaign_id:
            query = query.where(VideoGeneration.campaign_id == campaign_id)
        query = query.order_by(VideoGeneration.created_at.desc())
        query = query.limit(limit).offset(offset)
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_public_videos(
        self,
        db: AsyncSession,
        limit: int = 20,
        offset: int = 0,
    ) -> list[VideoGeneration]:
        query = (
            select(VideoGeneration)
            .where(
                VideoGeneration.status == VideoStatus.COMPLETED,
                VideoGeneration.is_public == 1,
                VideoGeneration.video_url.isnot(None),
            )
            .order_by(VideoGeneration.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    async def check_kling_available(self) -> bool:
        return await kling_client.check_available()

    async def upload_user_video(
        self,
        db: AsyncSession,
        user: User,
        file_content: bytes,
        filename: str,
        content_type: str,
        title: Optional[str] = None,
        campaign_id: Optional[uuid.UUID] = None,
        is_public: bool = True,
    ) -> VideoGeneration:
        import boto3
        import os

        video_id = uuid.uuid4()
        ext = filename.rsplit(".", 1)[-1] if "." in filename else "mp4"
        s3_key = f"videos/{user.id}/{video_id}/video.{ext}"
        s3_endpoint = os.getenv("AWS_ENDPOINT_URL", "http://localhost:4566")
        s3_bucket = os.getenv("S3_BUCKET_MEDIA", "campaia-dev-media")
        aws_region = os.getenv("AWS_REGION", "eu-central-1")
        s3_client = boto3.client(
            "s3",
            endpoint_url=s3_endpoint,
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "test"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "test"),
            region_name=aws_region,
        )
        try:
            s3_client.head_bucket(Bucket=s3_bucket)
        except Exception:
            try:
                s3_client.create_bucket(
                    Bucket=s3_bucket,
                    CreateBucketConfiguration={"LocationConstraint": aws_region},
                )
            except Exception as ex:
                logger.warning("Bucket create: %s", ex)
        s3_client.put_object(
            Bucket=s3_bucket,
            Key=s3_key,
            Body=file_content,
            ContentType=content_type,
        )
        if "localhost" in s3_endpoint or "localstack" in s3_endpoint:
            video_url = f"{s3_endpoint}/{s3_bucket}/{s3_key}"
        else:
            video_url = f"https://{s3_bucket}.s3.{aws_region}.amazonaws.com/{s3_key}"
        video_record = VideoGeneration(
            id=video_id,
            user_id=user.id,
            campaign_id=campaign_id,
            prompt=title or f"User uploaded: {filename}",
            duration=VideoDuration.SHORT,
            quality=VideoQuality.STANDARD,
            video_provider=VideoProviderId.UPLOAD.value,
            provider_used=VideoProviderId.UPLOAD.value,
            fallback_used=False,
            aspect_ratio="9:16",
            status=VideoStatus.COMPLETED,
            video_url=video_url,
            s3_key=s3_key,
            file_size_bytes=len(file_content),
            tokens_spent=0,
            is_public=1 if is_public else 0,
            title=title,
            progress_percent=100,
        )
        db.add(video_record)
        await db.commit()
        await db.refresh(video_record)
        return video_record

    async def delete_video(
        self,
        db: AsyncSession,
        video_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> bool:
        result = await db.execute(
            select(VideoGeneration).where(
                VideoGeneration.id == video_id,
                VideoGeneration.user_id == user_id,
            )
        )
        video = result.scalar_one_or_none()
        if not video:
            return False
        await db.delete(video)
        await db.commit()
        return True

    async def update_video_title(
        self,
        db: AsyncSession,
        video_id: uuid.UUID,
        user_id: uuid.UUID,
        title: str,
    ) -> Optional[VideoGeneration]:
        result = await db.execute(
            select(VideoGeneration).where(
                VideoGeneration.id == video_id,
                VideoGeneration.user_id == user_id,
            )
        )
        video = result.scalar_one_or_none()
        if not video:
            return None
        video.title = title
        await db.commit()
        await db.refresh(video)
        return video


video_service = VideoGenerationService()
