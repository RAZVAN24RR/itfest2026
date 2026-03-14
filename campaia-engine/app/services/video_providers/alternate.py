"""
Alternate video providers (Runway, Pika, Stable Video).

When API keys are missing or calls fail, the orchestrator falls back to Kling.
Real integrations can be added later without changing the pipeline contract.
"""

import logging
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
        if not getattr(settings, "runway_api_key", "") or not settings.runway_api_key.strip():
            logger.info("Runway: no API key — alternate attempt %s failed", attempt)
            raise AlternateProviderError("Runway not configured")
        # Placeholder: real Runway API would run here
        raise AlternateProviderError("Runway API not wired yet")

    if provider == VideoProviderId.PIKA:
        if not getattr(settings, "pika_api_key", "") or not settings.pika_api_key.strip():
            logger.info("Pika: no API key — alternate attempt %s failed", attempt)
            raise AlternateProviderError("Pika not configured")
        raise AlternateProviderError("Pika API not wired yet")

    if provider == VideoProviderId.STABLE_VIDEO:
        if not getattr(settings, "stable_video_url", "") or not settings.stable_video_url.strip():
            logger.info("Stable Video: no local endpoint — alternate attempt %s failed", attempt)
            raise AlternateProviderError("Stable Video not configured")
        raise AlternateProviderError("Stable Video worker not wired yet")

    raise AlternateProviderError("unknown provider")
