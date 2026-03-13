"""
Campaia Engine - TikTok Ad Publisher Service

Service pentru publicarea campaniilor Campaia pe TikTok Ads.
Integrează campaniile interne cu TikTok Marketing API.

Flow:
1. Campanie Campaia creată de utilizator
2. Video generat cu Kling AI
3. Publisher creează: Campaign → AdGroup → Ad pe TikTok
4. Status sincronizat înapoi în Campaia
"""

import logging
from typing import Optional
from datetime import datetime, timedelta
from uuid import UUID

from app.services.tiktok.tiktok_client import (
    tiktok_client,
    TikTokClient,
    TikTokObjective,
    TikTokBudgetMode,
    TikTokBillingEvent,
    TikTokAdStatus,
    TikTokEnvironment,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


# Mapping Campaia interests to TikTok interest category IDs
INTEREST_MAPPING = {
    "Technology": ["15001"],
    "Fashion": ["15002"],
    "Food": ["15003"],
    "Travel": ["15004"],
    "Fitness": ["15005"],
    "Beauty": ["15006"],
    "Gaming": ["15007"],
    "Sports": ["15008"],
    "Music": ["15009"],
    "Entertainment": ["15010"],
    "Business": ["15011"],
    "Education": ["15012"],
    "Health": ["15013"],
    "Lifestyle": ["15014"],
}

# Mapping Campaia countries to TikTok location IDs
COUNTRY_LOCATION_IDS = {
    "RO": "642",      # Romania
    "DE": "276",      # Germany
    "FR": "250",      # France
    "IT": "380",      # Italy
    "ES": "724",      # Spain
    "GB": "826",      # United Kingdom
    "US": "840",      # United States
    "NL": "528",      # Netherlands
    "BE": "056",      # Belgium
    "AT": "040",      # Austria
    "PL": "616",      # Poland
    "HU": "348",      # Hungary
}

# Age group mapping
AGE_GROUP_MAPPING = {
    "18-24": "AGE_18_24",
    "25-34": "AGE_25_34",
    "35-44": "AGE_35_44",
    "45-54": "AGE_45_54",
    "55+": "AGE_55_100",
}

# Gender mapping
GENDER_MAPPING = {
    "all": "GENDER_UNLIMITED",
    "male": "GENDER_MALE",
    "female": "GENDER_FEMALE",
}


class TikTokAdPublisher:
    """
    Publisher service pentru publicarea campaniilor pe TikTok.
    
    Responsabilități:
    - Crearea structurii complete: Campaign → AdGroup → Ad
    - Upload video pe TikTok
    - Maparea targeting-ului Campaia → TikTok
    - Sincronizare status
    """
    
    def __init__(self, client: Optional[TikTokClient] = None):
        """
        Initialize publisher.
        
        Args:
            client: Optional TikTok client (uses default if not provided)
        """
        self._client = client or tiktok_client
    
    async def check_ready(self) -> dict:
        """
        Check if TikTok integration is ready for publishing.
        
        Returns:
            Dict with status and any errors
        """
        return await self._client.check_connection()
    
    async def publish_campaign(
        self,
        campaign_id: UUID,
        campaign_name: str,
        video_url: str,
        ad_text: str,
        landing_page_url: str,
        budget_daily: float,
        duration_days: int = 7,
        countries: list[str] = None,
        age_min: int = 18,
        age_max: int = 65,
        gender: str = "all",
        interests: list[str] = None,
        user_email: str = None,
    ) -> dict:
        """
        Publish a complete campaign to TikTok Ads.
        
        Creates the full structure: Campaign → AdGroup → Ad
        
        Args:
            campaign_id: Campaia campaign UUID (for tracking)
            campaign_name: Display name for the campaign
            video_url: Public URL of the video to advertise
            ad_text: Ad copy/description
            landing_page_url: Where users are directed
            budget_daily: Daily budget in EUR
            duration_days: How long to run the campaign
            countries: List of country codes (e.g., ["RO", "DE"])
            age_min: Minimum target age
            age_max: Maximum target age
            gender: "all", "male", or "female"
            interests: List of interest categories
            user_email: Campaia user email (for naming)
            
        Returns:
            Dict with TikTok IDs (campaign_id, adgroup_id, ad_id, video_id)
        """
        logger.info(f"Publishing campaign {campaign_id} to TikTok...")
        
        try:
            # Step 1: Upload video to TikTok
            logger.info("Step 1: Uploading video to TikTok...")
            video_name = f"campaia_{campaign_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            video_result = await self._client.upload_video_by_url(
                video_url=video_url,
                video_name=video_name,
                is_third_party=True,
            )
            
            tiktok_video_id = video_result.get("video_id")
            if not tiktok_video_id:
                raise RuntimeError("Failed to get video_id from TikTok upload")
            
            logger.info(f"Video uploaded: {tiktok_video_id}")
            
            # Step 2: Wait for video processing
            logger.info("Step 2: Waiting for video processing...")
            await self._client.wait_for_video_ready(
                video_id=tiktok_video_id,
                timeout_seconds=300,
                poll_interval=10,
            )
            logger.info("Video processed and ready")
            
            # Step 3: Create TikTok Campaign
            logger.info("Step 3: Creating TikTok campaign...")
            tiktok_campaign_name = self._generate_campaign_name(
                campaign_name=campaign_name,
                campaign_id=campaign_id,
                user_email=user_email,
            )
            
            campaign_result = await self._client.create_campaign(
                campaign_name=tiktok_campaign_name,
                objective=TikTokObjective.TRAFFIC,
                budget=budget_daily,
                budget_mode=TikTokBudgetMode.BUDGET_MODE_DAY,
            )
            
            tiktok_campaign_id = campaign_result.get("campaign_id")
            if not tiktok_campaign_id:
                raise RuntimeError("Failed to get campaign_id from TikTok")
            
            logger.info(f"Campaign created: {tiktok_campaign_id}")
            
            # Step 4: Create Ad Group with targeting
            logger.info("Step 4: Creating ad group with targeting...")
            
            # Map targeting
            location_ids = self._map_locations(countries)
            age_groups = self._map_age_groups(age_min, age_max)
            gender_value = GENDER_MAPPING.get(gender.lower(), "GENDER_UNLIMITED")
            interest_ids = self._map_interests(interests) if interests else None
            
            # Calculate schedule
            start_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            end_time = (datetime.now() + timedelta(days=duration_days)).strftime("%Y-%m-%d %H:%M:%S")
            
            adgroup_result = await self._client.create_ad_group(
                campaign_id=tiktok_campaign_id,
                adgroup_name=f"{campaign_name} - AdGroup",
                budget=budget_daily,
                budget_mode=TikTokBudgetMode.BUDGET_MODE_DAY,
                billing_event=TikTokBillingEvent.CPM,
                bid_price=5.0,  # Default bid
                location_ids=location_ids,
                age_groups=age_groups,
                gender=gender_value,
                interests=interest_ids,
                schedule_start_time=start_time,
                schedule_end_time=end_time,
            )
            
            tiktok_adgroup_id = adgroup_result.get("adgroup_id")
            if not tiktok_adgroup_id:
                raise RuntimeError("Failed to get adgroup_id from TikTok")
            
            logger.info(f"Ad group created: {tiktok_adgroup_id}")
            
            # Step 5: Create Ad
            logger.info("Step 5: Creating ad...")
            
            ad_result = await self._client.create_ad(
                adgroup_id=tiktok_adgroup_id,
                ad_name=f"{campaign_name} - Ad",
                video_id=tiktok_video_id,
                ad_text=ad_text[:100],  # TikTok has text length limits
                call_to_action="LEARN_MORE",
                landing_page_url=landing_page_url,
                display_name="Campaia",
            )
            
            tiktok_ad_id = ad_result.get("ad_ids", [None])[0]
            if not tiktok_ad_id:
                tiktok_ad_id = ad_result.get("ad_id")
            
            logger.info(f"Ad created: {tiktok_ad_id}")
            
            # Success!
            return {
                "success": True,
                "tiktok_campaign_id": tiktok_campaign_id,
                "tiktok_adgroup_id": tiktok_adgroup_id,
                "tiktok_ad_id": tiktok_ad_id,
                "tiktok_video_id": tiktok_video_id,
                "environment": self._client._environment.value,
            }
            
        except Exception as e:
            logger.error(f"Failed to publish campaign to TikTok: {str(e)}")
            return {
                "success": False,
                "error": str(e),
            }
    
    async def pause_campaign(self, tiktok_campaign_id: str) -> dict:
        """
        Pause a TikTok campaign.
        
        Args:
            tiktok_campaign_id: TikTok campaign ID
            
        Returns:
            Result dict
        """
        try:
            await self._client.update_campaign_status(
                campaign_id=tiktok_campaign_id,
                status=TikTokAdStatus.DISABLE,
            )
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def resume_campaign(self, tiktok_campaign_id: str) -> dict:
        """
        Resume a paused TikTok campaign.
        
        Args:
            tiktok_campaign_id: TikTok campaign ID
            
        Returns:
            Result dict
        """
        try:
            await self._client.update_campaign_status(
                campaign_id=tiktok_campaign_id,
                status=TikTokAdStatus.ENABLE,
            )
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def get_campaign_status(self, tiktok_campaign_id: str) -> dict:
        """
        Get current status of a TikTok campaign.
        
        Args:
            tiktok_campaign_id: TikTok campaign ID
            
        Returns:
            Campaign status info
        """
        try:
            campaign = await self._client.get_campaign_by_id(tiktok_campaign_id)
            return {
                "success": True,
                "status": campaign.get("status"),
                "budget": campaign.get("budget"),
                "spend": campaign.get("spend", 0),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ==========================================
    # HELPER METHODS
    # ==========================================
    
    def _generate_campaign_name(
        self,
        campaign_name: str,
        campaign_id: UUID,
        user_email: str = None,
    ) -> str:
        """Generate unique campaign name for TikTok."""
        parts = ["Campaia"]
        
        if user_email:
            # Extract username from email
            username = user_email.split("@")[0][:10]
            parts.append(username)
        
        parts.append(campaign_name[:30])  # Limit name length
        parts.append(str(campaign_id)[:8])  # Short UUID
        
        return " - ".join(parts)
    
    def _map_locations(self, countries: list[str] = None) -> list[str]:
        """Map country codes to TikTok location IDs."""
        if not countries:
            return [COUNTRY_LOCATION_IDS.get("RO", "642")]  # Default: Romania
        
        location_ids = []
        for country in countries:
            loc_id = COUNTRY_LOCATION_IDS.get(country.upper())
            if loc_id:
                location_ids.append(loc_id)
        
        return location_ids if location_ids else [COUNTRY_LOCATION_IDS.get("RO", "642")]
    
    def _map_age_groups(self, age_min: int, age_max: int) -> list[str]:
        """Map age range to TikTok age groups."""
        age_groups = []
        
        if age_min <= 24 and age_max >= 18:
            age_groups.append("AGE_18_24")
        if age_min <= 34 and age_max >= 25:
            age_groups.append("AGE_25_34")
        if age_min <= 44 and age_max >= 35:
            age_groups.append("AGE_35_44")
        if age_min <= 54 and age_max >= 45:
            age_groups.append("AGE_45_54")
        if age_max >= 55:
            age_groups.append("AGE_55_100")
        
        return age_groups if age_groups else ["AGE_18_24", "AGE_25_34"]
    
    def _map_interests(self, interests: list[str] = None) -> list[str]:
        """Map Campaia interests to TikTok interest category IDs."""
        if not interests:
            return None
        
        interest_ids = []
        for interest in interests:
            ids = INTEREST_MAPPING.get(interest)
            if ids:
                interest_ids.extend(ids)
        
        return interest_ids if interest_ids else None


# Singleton instance
tiktok_ad_publisher = TikTokAdPublisher()
