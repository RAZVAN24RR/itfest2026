"""
Campaia Engine - AI Routes

API endpoints for AI-powered generation (scripts, hashtags, audience).
"""

from fastapi import APIRouter, HTTPException, status

import math

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.schemas.ai import (
    ScriptGenerateRequest,
    ScriptGenerateResponse,
    HashtagGenerateRequest,
    HashtagGenerateResponse,
    AudienceSuggestRequest,
    AudienceSuggestResponse,
    AIStatusResponse,
    MarketingDescriptionRequest,
    MarketingDescriptionResponse,
    KlingPromptRequest,
    KlingPromptResponse,
)
from app.services.ai.text_generator import text_generator
from app.services.wallet_service import WalletService, InsufficientBalanceError

router = APIRouter()


def _calc_cost(base_cost: int, model_key: str) -> int:
    """Apply model multiplier to base token cost."""
    multiplier = text_generator.get_cost_multiplier(model_key)
    return math.ceil(base_cost * multiplier)


@router.get(
    "/status",
    response_model=AIStatusResponse,
    summary="Check AI service status",
)
async def get_ai_status() -> AIStatusResponse:
    """Check if the AI service is available."""
    available = await text_generator.check_available()
    return AIStatusResponse(
        available=available,
        models=text_generator.MODELS,
        provider="ollama",
    )


@router.post(
    "/generate-script",
    response_model=ScriptGenerateResponse,
    summary="Generate TikTok ad script variants",
)
async def generate_script(
    data: ScriptGenerateRequest,
    user: CurrentUser,
    db: DbSession,
) -> ScriptGenerateResponse:
    """
    Generate TikTok ad script variants using AI.
    
    Cost depends on model: llama (base) or deepseek (2x).
    Returns multiple script variants for the user to choose from.
    """
    tokens_cost = _calc_cost(settings.cost_script_generation, data.ai_model)
    
    wallet_service = WalletService(db)
    has_balance = await wallet_service.check_balance(user.id, tokens_cost)
    if not has_balance:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient tokens. Required: {tokens_cost}",
        )
    
    try:
        scripts = await text_generator.generate_script(
            product_description=data.product_description,
            product_url=data.product_url,
            tone=data.tone,
            duration_seconds=data.duration_seconds,
            language=data.language,
            variants=data.variants,
            model_key=data.ai_model,
        )
        
        await wallet_service.spend_tokens(
            user_id=user.id,
            amount=tokens_cost,
            description=f"Script generation [{data.ai_model}] ({data.tone} tone, {data.variants} variants)",
            action_type="SCRIPT",
        )
        
        return ScriptGenerateResponse(
            scripts=scripts,
            tokens_spent=tokens_cost,
            tone=data.tone,
            duration_seconds=data.duration_seconds,
            language=data.language,
            variants_count=len(scripts),
            ai_model=data.ai_model,
        )
        
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )


@router.post(
    "/generate-hashtags",
    response_model=HashtagGenerateResponse,
    summary="Generate hashtags",
)
async def generate_hashtags(
    data: HashtagGenerateRequest,
    user: CurrentUser,
    db: DbSession,
) -> HashtagGenerateResponse:
    """
    Generate relevant hashtags for a TikTok ad.
    
    Cost depends on model: llama (base) or deepseek (2x).
    """
    tokens_cost = _calc_cost(settings.cost_hashtag_suggestion, data.ai_model)
    
    wallet_service = WalletService(db)
    has_balance = await wallet_service.check_balance(user.id, tokens_cost)
    if not has_balance:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient tokens. Required: {tokens_cost}",
        )
    
    try:
        hashtags = await text_generator.generate_hashtags(
            product_description=data.product_description,
            count=data.count,
            model_key=data.ai_model,
        )
        
        await wallet_service.spend_tokens(
            user_id=user.id,
            amount=tokens_cost,
            description=f"Hashtag generation [{data.ai_model}]",
            action_type="SCRIPT",
        )
        
        return HashtagGenerateResponse(
            hashtags=hashtags,
            tokens_spent=tokens_cost,
            ai_model=data.ai_model,
        )
        
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )


@router.post(
    "/suggest-audience",
    response_model=AudienceSuggestResponse,
    summary="Suggest target audience",
)
async def suggest_audience(
    data: AudienceSuggestRequest,
    user: CurrentUser,
    db: DbSession,
) -> AudienceSuggestResponse:
    """
    Get AI-powered audience suggestions for a product.
    
    Cost depends on model: llama (base) or deepseek (2x).
    """
    tokens_cost = _calc_cost(settings.cost_audience_suggestion, data.ai_model)
    
    wallet_service = WalletService(db)
    has_balance = await wallet_service.check_balance(user.id, tokens_cost)
    if not has_balance:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient tokens. Required: {tokens_cost}",
        )
    
    try:
        result = await text_generator.suggest_audience(
            product_description=data.product_description,
            model_key=data.ai_model,
        )
        
        await wallet_service.spend_tokens(
            user_id=user.id,
            amount=tokens_cost,
            description=f"Audience suggestion [{data.ai_model}]",
            action_type="TARGETING",
        )
        
        return AudienceSuggestResponse(
            age_range=result["age_range"],
            gender=result["gender"],
            interests=result["interests"],
            locations=result["locations"],
            description=result["description"],
            tokens_spent=tokens_cost,
            ai_model=data.ai_model,
        )
        
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )


@router.post(
    "/generate-marketing-description",
    response_model=MarketingDescriptionResponse,
    summary="Generate marketing description",
)
async def generate_marketing_description(
    data: MarketingDescriptionRequest,
    user: CurrentUser,
    db: DbSession,
) -> MarketingDescriptionResponse:
    """
    Generate a short (20-30 words) marketing description with one emoji.
    
    Cost depends on model: llama (base) or deepseek (2x).
    """
    tokens_cost = _calc_cost(settings.cost_marketing_description, data.ai_model)
    
    wallet_service = WalletService(db)
    has_balance = await wallet_service.check_balance(user.id, tokens_cost)
    if not has_balance:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient tokens. Required: {tokens_cost}",
        )
    
    try:
        description = await text_generator.generate_marketing_description(
            product_description=data.product_description,
            language=data.language,
            model_key=data.ai_model,
        )
        
        await wallet_service.spend_tokens(
            user_id=user.id,
            amount=tokens_cost,
            description=f"Marketing description [{data.ai_model}]",
            action_type="SCRIPT",
        )
        
        return MarketingDescriptionResponse(
            description=description,
            tokens_spent=tokens_cost,
            ai_model=data.ai_model,
        )
        
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )


@router.post(
    "/generate-kling-prompt",
    response_model=KlingPromptResponse,
    summary="Generate Kling AI video prompt",
)
async def generate_kling_prompt(
    data: KlingPromptRequest,
    user: CurrentUser,
    db: DbSession,
) -> KlingPromptResponse:
    """
    Generate a detailed cinematic prompt for Kling AI video generation.
    
    Cost depends on model: llama (base) or deepseek (2x).
    """
    tokens_cost = _calc_cost(settings.cost_kling_prompt, data.ai_model)
    
    wallet_service = WalletService(db)
    has_balance = await wallet_service.check_balance(user.id, tokens_cost)
    if not has_balance:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient tokens. Required: {tokens_cost}",
        )
    
    try:
        prompt = await text_generator.generate_kling_prompt(
            product_description=data.product_description,
            language=data.language,
            model_key=data.ai_model,
        )
        
        await wallet_service.spend_tokens(
            user_id=user.id,
            amount=tokens_cost,
            description=f"Kling AI prompt [{data.ai_model}]",
            action_type="SCRIPT",
        )
        
        return KlingPromptResponse(
            prompt=prompt,
            tokens_spent=tokens_cost,
            ai_model=data.ai_model,
        )
        
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
