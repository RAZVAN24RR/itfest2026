"""Video provider ids, model names, UX labels, and token multipliers."""

from enum import Enum


class VideoProviderId(str, Enum):
    KLING = "KLING"
    RUNWAY = "RUNWAY"
    PIKA = "PIKA"
    STABLE_VIDEO = "STABLE_VIDEO"
    UPLOAD = "UPLOAD"


PROVIDER_META = {
    VideoProviderId.KLING: {
        "label": "Fast generation",
        "model": "Kling v1.6",
        "description": "Quick, reliable 9:16 clips via Kling AI cloud",
        "mult": 1.0,
    },
    VideoProviderId.RUNWAY: {
        "label": "Cinematic quality",
        "model": "Runway Gen-3 Alpha",
        "description": "Rich, film-like look — cloud API",
        "mult": 1.35,
    },
    VideoProviderId.PIKA: {
        "label": "Social media style",
        "model": "Pika 1.0",
        "description": "Trendy, vertical-ready — cloud API",
        "mult": 1.0,
    },
    VideoProviderId.STABLE_VIDEO: {
        "label": "Local AI (on your GPU)",
        "model": "ModelScope v1.7b",
        "description": "Runs on your machine — no cloud, lower cost",
        "mult": 0.55,
    },
}

PROVIDER_LABELS = {p: m["label"] for p, m in PROVIDER_META.items()}
PROVIDER_MODELS = {p: m["model"] for p, m in PROVIDER_META.items()}


def provider_token_multiplier(provider: VideoProviderId) -> float:
    return PROVIDER_META.get(provider, {}).get("mult", 1.0)
