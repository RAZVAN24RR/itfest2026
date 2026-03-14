"""
Campaia Engine - Application Configuration

Uses Pydantic Settings for environment variable management.
All settings are loaded from environment variables with sensible defaults for development.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, RedisDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ============================================
    # Application
    # ============================================
    app_name: str = "Campaia API"
    app_version: str = "0.1.0"
    debug: bool = Field(default=True, description="Enable debug mode")
    environment: Literal["development", "staging", "production"] = Field(
        default="development",
        description="Current environment",
    )

    # ============================================
    # Security
    # ============================================
    secret_key: str = Field(
        default="dev-secret-key-change-in-production",
        description="Secret key for JWT tokens",
    )
    access_token_expire_minutes: int = Field(
        default=60 * 24 * 7,  # 7 days
        description="Access token expiration time in minutes",
    )
    algorithm: str = Field(default="HS256", description="JWT algorithm")

    # ============================================
    # Database
    # ============================================
    database_url: PostgresDsn = Field(
        default="postgresql+asyncpg://campaia:campaia_secret@localhost:5432/campaia",
        description="PostgreSQL connection URL",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Ensure async driver is used."""
        if v and "postgresql://" in v and "+asyncpg" not in v:
            v = v.replace("postgresql://", "postgresql+asyncpg://")
        return v

    # ============================================
    # Redis
    # ============================================
    redis_url: RedisDsn = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL",
    )

    # ============================================
    # CORS
    # ============================================
    cors_origins_str: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        alias="cors_origins",
        description="Allowed CORS origins (comma-separated)",
    )

    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        if not self.cors_origins_str:
            return ["http://localhost:5173"]
        return [origin.strip() for origin in self.cors_origins_str.split(",") if origin.strip()]

    # ============================================
    # External APIs - Stripe
    # ============================================
    stripe_secret_key: str = Field(default="", description="Stripe secret key")
    stripe_webhook_secret: str = Field(default="", description="Stripe webhook secret")

    # ============================================
    # External APIs - OpenAI
    # ============================================
    openai_api_key: str = Field(default="", description="OpenAI API key")

    # ============================================
    # Ollama (Local AI)
    # ============================================
    ollama_url: str = Field(default="http://localhost:11434", description="Ollama API URL")
    ollama_model: str = Field(default="llama3.2:latest", description="Default Ollama model for text generation")

    # ============================================
    # External APIs - Kling AI
    # ============================================
    kling_api_key: str = Field(default="", description="Kling AI API key")
    kling_api_secret: str = Field(default="", description="Kling AI API secret")

    # ============================================
    # External APIs - TikTok (Model Centralizat - Contul Campaia)
    # ============================================
    tiktok_app_id: str = Field(default="", description="TikTok app ID")
    tiktok_app_secret: str = Field(default="", description="TikTok app secret")
    tiktok_access_token: str = Field(default="", description="TikTok access token for Campaia account")
    tiktok_advertiser_id: str = Field(default="", description="TikTok advertiser ID for Campaia account")
    tiktok_environment: str = Field(default="sandbox", description="TikTok environment: sandbox or production")
    tiktok_metrics_admin_emails: str = Field(
        default="razvanandreipasaran@gmail.com",
        description="Comma-separated emails allowed to call GET /tiktok/metrics (same as before if unset)",
    )

    # ============================================
    # AWS / S3
    # ============================================
    aws_access_key_id: str = Field(default="test", description="AWS access key ID")
    aws_secret_access_key: str = Field(
        default="test", description="AWS secret access key"
    )
    aws_region: str = Field(default="eu-central-1", description="AWS region")
    aws_endpoint_url: str | None = Field(
        default="http://localstack:4566",
        description="AWS endpoint URL (for LocalStack)",
    )
    s3_bucket_media: str = Field(
        default="campaia-dev-media", description="S3 bucket for media files"
    )
    s3_bucket_invoices: str = Field(
        default="campaia-dev-invoices", description="S3 bucket for invoices"
    )

    # ============================================
    # Email / SMTP
    # ============================================
    mail_from: str = Field(default="noreply@campaia.com", description="Sender email address")
    mail_from_name: str = Field(default="DEVDELTA SRL", description="Sender name")
    smtp_host: str = Field(default="localhost", description="SMTP host")
    smtp_port: int = Field(default=1025, description="SMTP port (1025 for MailHog)")
    smtp_user: str = Field(default="", description="SMTP username")
    smtp_password: str = Field(default="", description="SMTP password")
    smtp_tls: bool = Field(default=False, description="Use TLS for SMTP")

    # ============================================
    # Token Costs (in tokens)
    # ============================================
    cost_script_generation: int = Field(default=5, description="Tokens for script gen")
    cost_image_generation: int = Field(default=15, description="Tokens for image gen")
    cost_video_5s_standard: int = Field(
        default=50, description="Tokens for 5s standard video"
    )
    cost_video_10s_standard: int = Field(
        default=80, description="Tokens for 10s standard video"
    )
    cost_video_5s_pro: int = Field(default=80, description="Tokens for 5s pro video")
    cost_video_10s_pro: int = Field(default=150, description="Tokens for 10s pro video")
    cost_audience_suggestion: int = Field(
        default=3, description="Tokens for audience suggestion"
    )
    cost_hashtag_suggestion: int = Field(
        default=2, description="Tokens for hashtag suggestion"
    )
    cost_marketing_description: int = Field(
        default=5, description="Tokens for marketing description"
    )
    cost_kling_prompt: int = Field(
        default=5, description="Tokens for Kling AI prompt"
    )

    # ============================================
    # Properties
    # ============================================
    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.environment == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Uses lru_cache to ensure settings are only loaded once.
    """
    return Settings()


# Convenience alias
settings = get_settings()
