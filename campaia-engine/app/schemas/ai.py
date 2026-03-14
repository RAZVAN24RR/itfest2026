"""
Campaia Engine - AI Schemas

Pydantic schemas for AI generation endpoints.
"""

from typing import Literal

from pydantic import BaseModel, Field


ToneType = Literal["professional", "casual", "viral", "funny"]
AIModelType = Literal["llama", "deepseek"]


class ScriptGenerateRequest(BaseModel):
    """Request to generate TikTok ad script variants."""
    product_description: str = Field(..., min_length=3, description="Description of the product/service")
    product_url: str = Field(default="", description="URL of the product")
    tone: ToneType = Field(default="viral", description="Tone of the script")
    duration_seconds: int = Field(default=15, ge=5, le=60, description="Target duration in seconds")
    language: str = Field(default="en", pattern="^(en|ro)$", description="Output language (en/ro)")
    variants: int = Field(default=5, ge=1, le=10, description="Number of script variants to generate")
    ai_model: AIModelType = Field(default="llama", description="AI model: llama (fast/cheap) or deepseek (premium)")


class ScriptGenerateResponse(BaseModel):
    """Response with generated script variants."""
    scripts: list[str] = Field(..., description="List of script variants")
    tokens_spent: int
    tone: str
    duration_seconds: int
    language: str
    variants_count: int
    ai_model: str


class HashtagGenerateRequest(BaseModel):
    """Request to generate hashtags."""
    product_description: str = Field(..., min_length=10, description="Description of the product/service")
    count: int = Field(default=10, ge=5, le=30, description="Number of hashtags to generate")
    ai_model: AIModelType = Field(default="llama", description="AI model: llama (fast/cheap) or deepseek (premium)")


class HashtagGenerateResponse(BaseModel):
    """Response with generated hashtags."""
    hashtags: list[str]
    tokens_spent: int
    ai_model: str


class AudienceSuggestRequest(BaseModel):
    """Request to suggest target audience."""
    product_description: str = Field(..., min_length=10, description="Description of the product/service")
    ai_model: AIModelType = Field(default="llama", description="AI model: llama (fast/cheap) or deepseek (premium)")


class AudienceSuggestResponse(BaseModel):
    """Response with audience suggestion."""
    age_range: str
    gender: str
    interests: list[str]
    locations: list[str]
    description: str
    tokens_spent: int
    ai_model: str


class AIStatusResponse(BaseModel):
    """Response with AI service status."""
    available: bool
    models: dict[str, str]
    provider: str


class MarketingDescriptionRequest(BaseModel):
    """Request to generate a short marketing description."""
    product_description: str = Field(..., min_length=3, description="Description of the product/service")
    language: str = Field(default="en", pattern="^(en|ro)$", description="Output language (en/ro)")
    ai_model: AIModelType = Field(default="llama", description="AI model: llama (fast/cheap) or deepseek (premium)")


class MarketingDescriptionResponse(BaseModel):
    """Response with generated marketing description."""
    description: str
    tokens_spent: int
    ai_model: str


class KlingPromptRequest(BaseModel):
    """Request to generate a Kling AI prompt."""
    product_description: str = Field(..., min_length=3, description="Description of the product/service")
    language: str = Field(default="en", pattern="^(en|ro)$", description="Output language (en/ro)")
    ai_model: AIModelType = Field(default="llama", description="AI model: llama (fast/cheap) or deepseek (premium)")


class KlingPromptResponse(BaseModel):
    """Response with generated Kling AI prompt."""
    prompt: str
    tokens_spent: int
    ai_model: str
