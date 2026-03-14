"""
Alternate video providers (Runway, Pika, Stable Video local).

When API keys are missing or calls fail, the orchestrator falls back to Kling.
"""

import logging
import httpx
from app.core.config import settings
from app.services.video_providers.base import VideoProviderId

logger = logging.getLogger(__name__)


class AlternateProviderError(Exception):
    """Alternate provider unavailable or failed."""


async def try_alternate_generation(
    provider: VideoProviderId,
    prompt: str,
    *,
    attempt: int = 1,
) -> str:
    """
    Attempt generation via Runway / Pika / Stable Video.
    Returns a temporary video URL if successful.
    Raises AlternateProviderError on failure (triggers Kling fallback).
    """
    if provider == VideoProviderId.KLING:
        raise AlternateProviderError("use Kling path")

    if provider == VideoProviderId.RUNWAY:
        key = getattr(settings, "runway_api_key", "")
        if not key or not key.strip():
            raise AlternateProviderError("Runway not configured")
        raise AlternateProviderError("Runway API not wired yet")

    if provider == VideoProviderId.PIKA:
        key = getattr(settings, "pika_api_key", "")
        if not key or not key.strip():
            raise AlternateProviderError("Pika not configured")
        raise AlternateProviderError("Pika API not wired yet")

    if provider == VideoProviderId.STABLE_VIDEO:
        url = getattr(settings, "stable_video_url", "")
        if not url or not url.strip():
            raise AlternateProviderError("Stable Video not configured (STABLE_VIDEO_URL empty)")

        base = url.rstrip("/")
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                health = await client.get(f"{base}/health")
                if health.status_code != 200:
                    raise AlternateProviderError(
                        f"Local video service unhealthy ({health.status_code})"
                    )
        except httpx.ConnectError:
            raise AlternateProviderError(
                f"Local video service unreachable at {base}"
            )
        except Exception as e:
            raise AlternateProviderError(f"Health check failed: {e}")

        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                resp = await client.post(
                    f"{base}/generate",
                    json={
                        "prompt": prompt,
                        "num_frames": 16,
                        "width": 256,
                        "height": 256,
                        "num_inference_steps": 25,
                    },
                )
                if resp.status_code != 200:
                    raise AlternateProviderError(
                        f"Local generation error {resp.status_code}: {resp.text[:200]}"
                    )
                # resp.content is raw mp4 bytes — caller must upload to S3
                return resp.content  # type: ignore[return-value]
        except AlternateProviderError:
            raise
        except Exception as e:
            raise AlternateProviderError(f"Local video generation failed: {e}")

    raise AlternateProviderError("unknown provider")
