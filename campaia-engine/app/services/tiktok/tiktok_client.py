"""
Campaia Engine - TikTok Marketing API Client

Client pentru TikTok Marketing API - Model CENTRALIZAT.
Toate campaniile sunt publicate pe contul TikTok Ads al Campaia.

Features:
- Autentificare cu access token din .env
- Campaign, AdGroup, și Ad creation
- Video asset upload
- Rate limiting și retry logic

TikTok Marketing API Documentation:
https://business-api.tiktok.com/portal/docs
"""

import time
import asyncio
from typing import Optional, Literal
from enum import Enum

import json
import httpx

from app.core.config import settings


class TikTokEnvironment(str, Enum):
    """TikTok API environment."""
    SANDBOX = "sandbox"
    PRODUCTION = "production"


class TikTokObjective(str, Enum):
    """Campaign objective types."""
    TRAFFIC = "TRAFFIC"
    CONVERSIONS = "CONVERSIONS"
    VIDEO_VIEWS = "VIDEO_VIEWS"
    REACH = "REACH"
    APP_INSTALLS = "APP_INSTALLS"
    LEAD_GENERATION = "LEAD_GENERATION"


class TikTokBudgetMode(str, Enum):
    """Budget mode for campaigns/ad groups."""
    BUDGET_MODE_DAY = "BUDGET_MODE_DAY"  # Daily budget
    BUDGET_MODE_TOTAL = "BUDGET_MODE_TOTAL"  # Total budget


class TikTokBillingEvent(str, Enum):
    """Billing event types for ad groups."""
    CPC = "CPC"  # Cost per click
    CPM = "CPM"  # Cost per 1000 impressions
    CPV = "CPV"  # Cost per video view
    OCPM = "OCPM"  # Optimized CPM


class TikTokPlacement(str, Enum):
    """Ad placement options."""
    TIKTOK = "PLACEMENT_TIKTOK"
    PANGLE = "PLACEMENT_PANGLE"


class TikTokAdStatus(str, Enum):
    """Ad/Campaign status."""
    ENABLE = "ENABLE"
    DISABLE = "DISABLE"


class TikTokClient:
    """
    TikTok Marketing API client - Model Centralizat.
    
    Toate campaniile sunt publicate pe contul TikTok Ads deținut de Campaia.
    Access token-ul este configurat în .env.
    
    Supports:
    - Campaign management (create, update, pause)
    - Ad group management
    - Ad creation
    - Video asset upload
    """
    
    # API Base URLs
    SANDBOX_API_URL = "https://sandbox-ads.tiktok.com/open_api/v1.3"
    PRODUCTION_API_URL = "https://business-api.tiktok.com/open_api/v1.3"
    
    def __init__(self, environment: TikTokEnvironment = TikTokEnvironment.SANDBOX):
        """
        Initialize TikTok client.
        
        Args:
            environment: SANDBOX or PRODUCTION
        """
        self._app_id = settings.tiktok_app_id
        self._app_secret = settings.tiktok_app_secret
        self._access_token = settings.tiktok_access_token
        self._advertiser_id = settings.tiktok_advertiser_id
        self._environment = environment
        
    @property
    def base_url(self) -> str:
        """Get base URL based on environment."""
        if self._environment == TikTokEnvironment.SANDBOX:
            return self.SANDBOX_API_URL
        return self.PRODUCTION_API_URL
    
    @property
    def is_configured(self) -> bool:
        """Check if TikTok credentials are configured."""
        return bool(self._access_token and self._advertiser_id)
    
    # ==========================================
    # HTTP REQUEST HELPER
    # ==========================================
    
    async def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[dict] = None,
        params: Optional[dict] = None,
        retries: int = 3,
        timeout: float = 60.0,
    ) -> dict:
        """
        Make authenticated request to TikTok API.
        
        Args:
            method: HTTP method (GET, POST)
            endpoint: API endpoint path
            data: Request body (for POST)
            params: Query parameters (for GET)
            retries: Number of retry attempts
            timeout: Request timeout in seconds
            
        Returns:
            API response data
        """
        if not self.is_configured:
            raise RuntimeError("TikTok credentials not configured in .env")
        
        url = f"{self.base_url}{endpoint}"
        headers = {
            "Access-Token": self._access_token,
            "Content-Type": "application/json",
        }
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            for attempt in range(retries):
                try:
                    if method.upper() == "GET":
                        # TikTok API requires lists in GET params to be JSON strings
                        processed_params = {}
                        if params:
                            for k, v in params.items():
                                if isinstance(v, list):
                                    processed_params[k] = json.dumps(v)
                                else:
                                    processed_params[k] = v
                        
                        response = await client.get(url, headers=headers, params=processed_params)
                    elif method.upper() == "POST":
                        response = await client.post(url, headers=headers, json=data)
                    else:
                        raise ValueError(f"Unsupported HTTP method: {method}")
                    
                    response.raise_for_status()
                    result = response.json()
                    
                    # Check TikTok API error codes
                    if result.get("code") != 0:
                        error_code = result.get("code")
                        error_msg = result.get("message", "Unknown error")
                        
                        # Rate limited - wait and retry
                        if error_code == 40100:
                            wait_time = 2 ** attempt
                            await asyncio.sleep(wait_time)
                            continue
                        
                        raise RuntimeError(f"TikTok API error [{error_code}]: {error_msg}")
                    
                    return result
                    
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 429:
                        wait_time = 2 ** attempt
                        await asyncio.sleep(wait_time)
                        continue
                    raise RuntimeError(f"TikTok API HTTP error: {e.response.status_code}")
                
                except httpx.RequestError as e:
                    if attempt < retries - 1:
                        wait_time = 2 ** attempt
                        await asyncio.sleep(wait_time)
                        continue
                    raise RuntimeError(f"TikTok API request failed: {str(e)}")
        
        raise RuntimeError("TikTok API request failed after all retries")
    
    # ==========================================
    # CAMPAIGN MANAGEMENT
    # ==========================================
    
    async def create_campaign(
        self,
        campaign_name: str,
        objective: TikTokObjective = TikTokObjective.TRAFFIC,
        budget: float = 50.0,
        budget_mode: TikTokBudgetMode = TikTokBudgetMode.BUDGET_MODE_DAY,
    ) -> dict:
        """
        Create a new advertising campaign.
        
        Args:
            campaign_name: Name of the campaign (prefixed with Campaia user info)
            objective: Campaign objective type
            budget: Budget amount (in account currency, e.g., EUR)
            budget_mode: Daily or total budget
            
        Returns:
            Dict with campaign_id
        """
        data = {
            "advertiser_id": self._advertiser_id,
            "campaign_name": campaign_name,
            "objective_type": objective.value,
            "budget": budget,
            "budget_mode": budget_mode.value,
        }
        
        result = await self._request("POST", "/campaign/create/", data)
        return result.get("data", {})
    
    async def get_campaigns(self, page: int = 1, page_size: int = 20) -> dict:
        """
        Get list of campaigns.
        
        Args:
            page: Page number
            page_size: Items per page
            
        Returns:
            Dict with list of campaigns
        """
        params = {
            "advertiser_id": self._advertiser_id,
            "page": page,
            "page_size": page_size,
        }
        
        result = await self._request("GET", "/campaign/get/", params=params)
        return result.get("data", {})
    
    async def get_campaign_by_id(self, campaign_id: str) -> dict:
        """
        Get campaign by ID.
        
        Args:
            campaign_id: TikTok campaign ID
            
        Returns:
            Campaign data
        """
        params = {
            "advertiser_id": self._advertiser_id,
            "filtering": {"campaign_ids": [campaign_id]},
        }
        
        result = await self._request("GET", "/campaign/get/", params=params)
        campaigns = result.get("data", {}).get("list", [])
        return campaigns[0] if campaigns else {}
    
    async def update_campaign_status(
        self, 
        campaign_id: str, 
        status: TikTokAdStatus
    ) -> dict:
        """
        Enable or disable a campaign.
        
        Args:
            campaign_id: Campaign ID to update
            status: ENABLE or DISABLE
            
        Returns:
            Update result
        """
        data = {
            "advertiser_id": self._advertiser_id,
            "campaign_ids": [campaign_id],
            "opt_status": status.value,
        }
        
        result = await self._request("POST", "/campaign/status/update/", data)
        return result.get("data", {})
    
    async def update_campaign_budget(
        self,
        campaign_id: str,
        budget: float,
    ) -> dict:
        """
        Update campaign budget.
        
        Args:
            campaign_id: Campaign ID
            budget: New budget amount
            
        Returns:
            Update result
        """
        data = {
            "advertiser_id": self._advertiser_id,
            "campaign_id": campaign_id,
            "budget": budget,
        }
        
        result = await self._request("POST", "/campaign/update/", data)
        return result.get("data", {})
    
    # ==========================================
    # AD GROUP MANAGEMENT
    # ==========================================
    
    async def create_ad_group(
        self,
        campaign_id: str,
        adgroup_name: str,
        budget: float = 20.0,
        budget_mode: TikTokBudgetMode = TikTokBudgetMode.BUDGET_MODE_DAY,
        billing_event: TikTokBillingEvent = TikTokBillingEvent.CPM,
        bid_price: float = 5.0,
        location_ids: list[str] = None,
        age_groups: list[str] = None,
        gender: str = "GENDER_UNLIMITED",
        interests: list[str] = None,
        placements: list[TikTokPlacement] = None,
        schedule_start_time: str = None,
        schedule_end_time: str = None,
    ) -> dict:
        """
        Create an ad group within a campaign.
        
        Args:
            campaign_id: Parent campaign ID
            adgroup_name: Name of the ad group
            budget: Budget amount
            budget_mode: Daily or total budget
            billing_event: How you're charged (CPC, CPM, etc)
            bid_price: Bid amount
            location_ids: Target location IDs (countries/regions)
            age_groups: Target age groups ["AGE_18_24", "AGE_25_34", etc]
            gender: Target gender: GENDER_MALE, GENDER_FEMALE, GENDER_UNLIMITED
            interests: Interest category IDs for targeting
            placements: Where ads appear
            schedule_start_time: Start time (format: 2024-01-01 00:00:00)
            schedule_end_time: End time (format: 2024-01-31 23:59:59)
            
        Returns:
            Dict with adgroup_id
        """
        # Default placements: TikTok only
        if not placements:
            placements = [TikTokPlacement.TIKTOK]
        
        # Default location: Romania
        if not location_ids:
            location_ids = ["642"]  # Romania location ID
        
        data = {
            "advertiser_id": self._advertiser_id,
            "campaign_id": campaign_id,
            "adgroup_name": adgroup_name,
            "placement_type": "PLACEMENT_TYPE_NORMAL",
            "placements": [p.value for p in placements],
            "location_ids": location_ids,
            "budget_mode": budget_mode.value,
            "budget": budget,
            "billing_event": billing_event.value,
            "bid_price": bid_price,
            "schedule_type": "SCHEDULE_START_END",
            "gender": gender,
            "optimization_goal": "CLICK",  # Optimize for clicks
        }
        
        if age_groups:
            data["age_groups"] = age_groups
        
        if interests:
            data["interest_category_ids"] = interests
        
        if schedule_start_time:
            data["schedule_start_time"] = schedule_start_time
        
        if schedule_end_time:
            data["schedule_end_time"] = schedule_end_time
        
        result = await self._request("POST", "/adgroup/create/", data)
        return result.get("data", {})
    
    async def update_adgroup_status(
        self,
        adgroup_id: str,
        status: TikTokAdStatus,
    ) -> dict:
        """
        Enable or disable an ad group.
        
        Args:
            adgroup_id: Ad group ID
            status: ENABLE or DISABLE
            
        Returns:
            Update result
        """
        data = {
            "advertiser_id": self._advertiser_id,
            "adgroup_ids": [adgroup_id],
            "opt_status": status.value,
        }
        
        result = await self._request("POST", "/adgroup/status/update/", data)
        return result.get("data", {})
    
    # ==========================================
    # AD CREATION
    # ==========================================
    
    async def create_ad(
        self,
        adgroup_id: str,
        ad_name: str,
        video_id: str,
        ad_text: str,
        call_to_action: str = "LEARN_MORE",
        landing_page_url: str = None,
        display_name: str = "Campaia",
    ) -> dict:
        """
        Create an ad within an ad group.
        
        Args:
            adgroup_id: Parent ad group ID
            ad_name: Name of the ad
            video_id: TikTok video asset ID
            ad_text: Ad copy/description
            call_to_action: CTA button text
            landing_page_url: URL to redirect users
            display_name: Name shown on the ad
            
        Returns:
            Dict with ad_id
        """
        creative = {
            "video_id": video_id,
            "ad_text": ad_text,
            "call_to_action": call_to_action,
            "display_name": display_name,
        }
        
        if landing_page_url:
            creative["landing_page_url"] = landing_page_url
        
        data = {
            "advertiser_id": self._advertiser_id,
            "adgroup_id": adgroup_id,
            "ad_name": ad_name,
            "ad_format": "SINGLE_VIDEO",
            "creatives": [creative],
        }
        
        result = await self._request("POST", "/ad/create/", data)
        return result.get("data", {})
    
    async def update_ad_status(
        self,
        ad_id: str,
        status: TikTokAdStatus,
    ) -> dict:
        """
        Enable or disable an ad.
        
        Args:
            ad_id: Ad ID
            status: ENABLE or DISABLE
            
        Returns:
            Update result
        """
        data = {
            "advertiser_id": self._advertiser_id,
            "ad_ids": [ad_id],
            "opt_status": status.value,
        }
        
        result = await self._request("POST", "/ad/status/update/", data)
        return result.get("data", {})
    
    # ==========================================
    # VIDEO UPLOAD
    # ==========================================
    
    async def upload_video_by_url(
        self, 
        video_url: str, 
        video_name: str,
        is_third_party: bool = False,
    ) -> dict:
        """
        Upload video to TikTok Ads by URL.
        
        Args:
            video_url: Public URL of the video file
            video_name: Name for the video asset
            is_third_party: If True, video is from external source
            
        Returns:
            Dict with video_id
        """
        data = {
            "advertiser_id": self._advertiser_id,
            "video_url": video_url,
            "file_name": video_name,
            "auto_bind_enabled": False,
            "auto_fix_enabled": True,
            "is_third_party": is_third_party,
        }
        
        result = await self._request("POST", "/file/video/ad/upload/", data)
        return result.get("data", {})
    
    async def get_video_info(self, video_ids: list[str]) -> dict:
        """
        Get video asset information and processing status.
        
        Args:
            video_ids: List of video IDs to query
            
        Returns:
            Dict with video info
        """
        params = {
            "advertiser_id": self._advertiser_id,
            "video_ids": video_ids,
        }
        
        result = await self._request("GET", "/file/video/ad/info/", params=params)
        return result.get("data", {})
    
    async def wait_for_video_ready(
        self,
        video_id: str,
        timeout_seconds: int = 300,
        poll_interval: int = 10,
    ) -> dict:
        """
        Wait for video to be processed and ready.
        
        Args:
            video_id: Video ID to check
            timeout_seconds: Maximum wait time
            poll_interval: Seconds between checks
            
        Returns:
            Video info when ready
        """
        start_time = time.time()
        
        while (time.time() - start_time) < timeout_seconds:
            info = await self.get_video_info([video_id])
            videos = info.get("list", [])
            
            if videos:
                video = videos[0]
                status = video.get("video_status")
                
                if status == "VIDEO_STATUS_APPROVED":
                    return video
                elif status in ["VIDEO_STATUS_FAILED", "VIDEO_STATUS_DELETED"]:
                    raise RuntimeError(f"Video processing failed: {status}")
            
            await asyncio.sleep(poll_interval)
        
        raise RuntimeError(f"Video processing timed out after {timeout_seconds}s")
    
    # ==========================================
    # ACCOUNT INFO
    # ==========================================
    
    async def get_advertiser_info(self) -> dict:
        """
        Get advertiser account information.
        
        Returns:
            Dict with account info (balance, currency, etc)
        """
        params = {
            "advertiser_ids": [self._advertiser_id],
        }
        
        result = await self._request("GET", "/advertiser/info/", params=params)
        accounts = result.get("data", {}).get("list", [])
        return accounts[0] if accounts else {}
    
    async def get_account_balance(self) -> dict:
        """
        Get account balance and spending info.
        
        Returns:
            Dict with balance info
        """
        info = await self.get_advertiser_info()
        return {
            "balance": info.get("balance", 0),
            "currency": info.get("currency", "EUR"),
            "timezone": info.get("timezone", "Europe/Bucharest"),
            "status": info.get("status", "UNKNOWN"),
        }
    
    async def get_integrated_report(
        self,
        start_date: str,
        end_date: str,
        data_level: str = "AUCTION_ADVERTISER",
        dimensions: list[str] = ["stat_time_day"],
        metrics: list[str] = ["spend", "impressions", "clicks", "conversion", "cost_per_conversion", "conversion_rate"],
    ) -> dict:
        """
        Get integrated report for the account.
        
        Args:
            start_date: Format YYYY-MM-DD
            end_date: Format YYYY-MM-DD
            data_level: AUCTION_ADVERTISER, AUCTION_CAMPAIGN, etc.
            dimensions: List of dimensions to group by
            metrics: List of metrics to fetch
            
        Returns:
            Report data
        """
        params = {
            "advertiser_id": self._advertiser_id,
            "report_type": "BASIC",
            "data_level": data_level,
            "dimensions": dimensions,
            "metrics": metrics,
            "start_date": start_date,
            "end_date": end_date,
            "page": 1,
            "page_size": 100,
        }
        
        try:
            result = await self._request("GET", "/report/integrated/get/", params=params)
            return result.get("data", {})
        except RuntimeError as e:
            # TikTok Sandbox does not support integrated reports (error 40009)
            # We catch it and return empty data to prevent 500 errors in dashboard
            if "40009" in str(e) and self._environment == TikTokEnvironment.SANDBOX:
                return {"list": [], "page_info": {"page": 1, "page_size": 100, "total_number": 0, "total_page": 0}}
            raise e

    # ==========================================
    # TARGETING HELPERS
    # ==========================================
    
    async def get_interest_categories(self) -> dict:
        """
        Get available interest categories for targeting.
        
        Returns:
            Dict with interest categories
        """
        params = {
            "advertiser_id": self._advertiser_id,
        }
        
        result = await self._request("GET", "/tools/interest_category/", params=params)
        return result.get("data", {})
    
    async def get_location_list(self, location_type: str = "COUNTRY") -> dict:
        """
        Get available locations for targeting.
        
        Args:
            location_type: COUNTRY, PROVINCE, or CITY
            
        Returns:
            Dict with locations
        """
        params = {
            "advertiser_id": self._advertiser_id,
            "location_types": [location_type],
        }
        
        result = await self._request("GET", "/tools/location/", params=params)
        return result.get("data", {})
    
    # ==========================================
    # HEALTH CHECK
    # ==========================================
    
    async def check_connection(self) -> dict:
        """
        Check if TikTok connection is working.
        
        Returns:
            Dict with connection status
        """
        if not self.is_configured:
            return {
                "connected": False,
                "error": "TikTok credentials not configured in .env (TIKTOK_ACCESS_TOKEN, TIKTOK_ADVERTISER_ID)",
                "environment": self._environment.value,
            }
        
        try:
            info = await self.get_advertiser_info()
            balance = await self.get_account_balance()
            
            return {
                "connected": True,
                "environment": self._environment.value,
                "advertiser_id": self._advertiser_id,
                "advertiser_name": info.get("name", "Unknown"),
                "balance": balance.get("balance", 0),
                "currency": balance.get("currency", "EUR"),
                "status": balance.get("status", "UNKNOWN"),
            }
        except Exception as e:
            return {
                "connected": False,
                "environment": self._environment.value,
                "error": str(e),
            }


# Singleton instance based on .env
_current_env = TikTokEnvironment.SANDBOX if settings.tiktok_environment == "sandbox" else TikTokEnvironment.PRODUCTION
tiktok_client = TikTokClient(environment=_current_env)
