"""
TikTok Marketing API Integration

This module provides TikTok Ads API integration for Campaia:
- OAuth 2.0 authentication flow
- Campaign creation and management
- Ad group and ad creation
- Video asset upload

Supports both Sandbox and Production environments.
"""

from app.services.tiktok.tiktok_client import tiktok_client, TikTokClient
from app.services.tiktok.tiktok_ad_publisher import tiktok_ad_publisher, TikTokAdPublisher

__all__ = [
    "tiktok_client",
    "TikTokClient",
    "tiktok_ad_publisher",
    "TikTokAdPublisher",
]
