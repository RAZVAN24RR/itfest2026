"""
Campaia Engine - Kling AI Client

Secure client for Kling AI API with JWT authentication.
Supports video generation (text-to-video, image-to-video).

Security:
- JWT tokens with short expiration (30 min)
- Automatic token refresh
- HTTPS only
- No credentials in logs
"""

import time
import asyncio
from typing import Literal, Optional
from enum import Enum

import jwt
import httpx

from app.core.config import settings


class KlingModel(str, Enum):
    """Available Kling AI models."""
    V1 = "kling-v1"
    V1_5 = "kling-v1-5"
    V1_6 = "kling-v1-6"
    V2 = "kling-v2"
    V2_1 = "kling-v2-1"


class KlingMode(str, Enum):
    """Video generation mode."""
    STANDARD = "std"
    PROFESSIONAL = "pro"


class KlingDuration(str, Enum):
    """Video duration."""
    SHORT = "5"   # 5 seconds
    LONG = "10"   # 10 seconds


class KlingAspectRatio(str, Enum):
    """Video aspect ratio - TikTok preferred is 9:16."""
    RATIO_16_9 = "16:9"    # Landscape
    RATIO_9_16 = "9:16"    # Portrait (TikTok)
    RATIO_1_1 = "1:1"      # Square


class KlingClient:
    """
    Secure Kling AI API client with JWT authentication.
    
    Features:
    - JWT token generation with auto-refresh
    - Text-to-video generation
    - Image-to-video generation  
    - Video status polling
    - Async HTTP calls with retries
    """
    
    BASE_URL = "https://api.klingai.com/v1"
    TOKEN_VALIDITY_SECONDS = 1800  # 30 minutes
    TOKEN_REFRESH_BUFFER = 300     # Refresh 5 min before expiry
    
    def __init__(self):
        self._access_key = settings.kling_api_key
        self._secret_key = settings.kling_api_secret
        self._token: Optional[str] = None
        self._token_expiry: int = 0
        
    def _generate_jwt_token(self) -> str:
        """
        Generate secure JWT token for Kling API authentication.
        
        The token is signed with HS256 algorithm and includes:
        - iss: Access key (issuer)
        - exp: Expiration time (30 min from now)
        - nbf: Not before time (5 sec before now to handle clock skew)
        """
        current_time = int(time.time())
        
        headers = {
            "alg": "HS256",
            "typ": "JWT"
        }
        
        payload = {
            "iss": self._access_key,
            "exp": current_time + self.TOKEN_VALIDITY_SECONDS,
            "nbf": current_time - 5,  # Handle clock skew
        }
        
        token = jwt.encode(payload, self._secret_key, algorithm="HS256", headers=headers)
        self._token = token
        self._token_expiry = current_time + self.TOKEN_VALIDITY_SECONDS
        
        return token
    
    def _get_token(self) -> str:
        """Get valid JWT token, refresh if needed."""
        current_time = int(time.time())
        
        # Generate new token if expired or about to expire
        if not self._token or current_time >= (self._token_expiry - self.TOKEN_REFRESH_BUFFER):
            return self._generate_jwt_token()
        
        return self._token
    
    def _get_headers(self) -> dict:
        """Get secure headers with JWT authorization."""
        return {
            "Authorization": f"Bearer {self._get_token()}",
            "Content-Type": "application/json",
        }
    
    async def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[dict] = None,
        retries: int = 3,
        timeout: float = 60.0,
    ) -> dict:
        """
        Make secure async HTTP request to Kling API.
        
        Features:
        - Automatic retries with exponential backoff
        - Timeout protection
        - Error handling
        """
        url = f"{self.BASE_URL}{endpoint}"
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            for attempt in range(retries):
                try:
                    if method.upper() == "GET":
                        response = await client.get(url, headers=self._get_headers())
                    elif method.upper() == "POST":
                        response = await client.post(url, headers=self._get_headers(), json=data)
                    else:
                        raise ValueError(f"Unsupported HTTP method: {method}")
                    
                    response.raise_for_status()
                    return response.json()
                    
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 401:
                        # Token expired, force refresh and retry
                        self._token = None
                        continue
                    elif e.response.status_code == 429:
                        # Rate limited, wait and retry
                        wait_time = 2 ** attempt
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        raise RuntimeError(f"Kling API error: {e.response.status_code} - {e.response.text}")
                
                except httpx.RequestError as e:
                    if attempt < retries - 1:
                        wait_time = 2 ** attempt
                        await asyncio.sleep(wait_time)
                        continue
                    raise RuntimeError(f"Kling API request failed: {str(e)}")
        
        raise RuntimeError("Kling API request failed after all retries")

    # ==========================================
    # TEXT TO VIDEO
    # ==========================================
    
    async def text_to_video(
        self,
        prompt: str,
        model: KlingModel = KlingModel.V1_6,
        mode: KlingMode = KlingMode.STANDARD,
        duration: KlingDuration = KlingDuration.SHORT,
        aspect_ratio: KlingAspectRatio = KlingAspectRatio.RATIO_9_16,
        negative_prompt: Optional[str] = None,
        cfg_scale: float = 0.5,
    ) -> dict:
        """
        Generate video from text prompt.
        
        Args:
            prompt: Description of the video to generate
            model: Kling model version (v1, v1.5, v1.6, v2, v2.1)
            mode: Quality mode (std=standard, pro=professional)
            duration: Video length (5 or 10 seconds)
            aspect_ratio: Video aspect ratio (9:16 for TikTok)
            negative_prompt: What to avoid in the video
            cfg_scale: Prompt adherence (0.0-1.0)
            
        Returns:
            Dict with task_id and status
        """
        data = {
            "model_name": model.value,
            "mode": mode.value,
            "duration": duration.value,
            "aspect_ratio": aspect_ratio.value,
            "prompt": prompt,
            "cfg_scale": cfg_scale,
        }
        
        if negative_prompt:
            data["negative_prompt"] = negative_prompt
        
        response = await self._request("POST", "/videos/text2video", data)
        return response
    
    # ==========================================
    # IMAGE TO VIDEO
    # ==========================================
    
    async def image_to_video(
        self,
        image_url: str,
        prompt: str = "",
        model: KlingModel = KlingModel.V1_6,
        mode: KlingMode = KlingMode.STANDARD,
        duration: KlingDuration = KlingDuration.SHORT,
        negative_prompt: Optional[str] = None,
        cfg_scale: float = 0.5,
    ) -> dict:
        """
        Generate video from an image.
        
        Args:
            image_url: URL of the source image
            prompt: Motion/action description
            model: Kling model version
            mode: Quality mode
            duration: Video length
            negative_prompt: What to avoid
            cfg_scale: Prompt adherence
            
        Returns:
            Dict with task_id and status
        """
        data = {
            "model_name": model.value,
            "mode": mode.value,
            "duration": duration.value,
            "image": image_url,
            "prompt": prompt,
            "cfg_scale": cfg_scale,
        }
        
        if negative_prompt:
            data["negative_prompt"] = negative_prompt
        
        response = await self._request("POST", "/videos/image2video", data)
        return response
    
    # ==========================================
    # VIDEO STATUS / QUERY
    # ==========================================
    
    async def get_video_status(self, task_id: str) -> dict:
        """
        Get the status of a video generation task.
        
        Args:
            task_id: The task ID returned from text2video or image2video
            
        Returns:
            Dict with status and video URL if completed
        """
        response = await self._request("GET", f"/videos/text2video/{task_id}")
        return response
    
    async def get_image_video_status(self, task_id: str) -> dict:
        """
        Get the status of an image-to-video generation task.
        
        Args:
            task_id: The task ID returned from image2video
            
        Returns:
            Dict with status and video URL if completed
        """
        response = await self._request("GET", f"/videos/image2video/{task_id}")
        return response
    
    # ==========================================
    # POLLING HELPER
    # ==========================================
    
    async def wait_for_video(
        self,
        task_id: str,
        is_image_to_video: bool = False,
        timeout_seconds: int = 600,
        poll_interval: int = 10,
    ) -> dict:
        """
        Wait for video generation to complete with polling.
        
        Args:
            task_id: The task ID to poll
            is_image_to_video: True if image-to-video, False for text-to-video
            timeout_seconds: Maximum time to wait (default 10 min)
            poll_interval: Seconds between polls (default 10s)
            
        Returns:
            Final status dict with video URL
            
        Raises:
            RuntimeError if timeout or generation fails
        """
        start_time = time.time()
        
        while (time.time() - start_time) < timeout_seconds:
            if is_image_to_video:
                status = await self.get_image_video_status(task_id)
            else:
                status = await self.get_video_status(task_id)
            
            # Check response structure
            task_status = status.get("data", {}).get("task_status", "")
            
            if task_status == "succeed":
                return status
            elif task_status == "failed":
                error_msg = status.get("data", {}).get("task_status_msg", "Unknown error")
                raise RuntimeError(f"Video generation failed: {error_msg}")
            
            # Still processing, wait and poll again
            await asyncio.sleep(poll_interval)
        
        raise RuntimeError(f"Video generation timed out after {timeout_seconds} seconds")
    
    # ==========================================
    # HEALTH CHECK
    # ==========================================
    
    async def check_available(self) -> bool:
        """Check if Kling API is available and credentials are valid."""
        if not self._access_key or not self._secret_key:
            return False
        
        try:
            # Simple test request
            await self._request("GET", "/account/credits", timeout=10.0)
            return True
        except Exception:
            return False


# Singleton instance
kling_client = KlingClient()
