"""Video provider ids and token multipliers (vs base Kling cost)."""

from enum import Enum


class VideoProviderId(str, Enum):
    KLING = "KLING"
    RUNWAY = "RUNWAY"
    PIKA = "PIKA"
    STABLE_VIDEO = "STABLE_VIDEO"
    UPLOAD = "UPLOAD"  # user upload — no AI


# UX labels (API may expose as generation_style)
PROVIDER_LABELS = {
    VideoProviderId.KLING: "Fast generation",
    VideoProviderId.RUNWAY: "Cinematic quality",
    VideoProviderId.PIKA: "Social media style",
    VideoProviderId.STABLE_VIDEO: "Experimental / local AI",
}


def provider_token_multiplier(provider: VideoProviderId) -> float:
    if provider == VideoProviderId.RUNWAY:
        return 1.35
    if provider == VideoProviderId.PIKA:
        return 1.0
    if provider == VideoProviderId.STABLE_VIDEO:
        return 0.55
    return 1.0
