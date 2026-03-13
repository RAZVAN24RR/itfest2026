"""
Campaia Engine - AI Routes

API endpoints for AI-powered generation (scripts, hashtags, audience).
"""

from fastapi import APIRouter, HTTPException, status

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
        model=settings.ollama_model,
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
    
    Costs 5 tokens per generation (regardless of variants count).
    Returns multiple script variants for the user to choose from.
    """
    tokens_cost = settings.cost_script_generation
    
    # Check balance
    wallet_service = WalletService(db)
    has_balance = await wallet_service.check_balance(user.id, tokens_cost)
    if not has_balance:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient tokens. Required: {tokens_cost}",
        )
    
    try:
        # Generate scripts
        scripts = await text_generator.generate_script(
            product_description=data.product_description,
            product_url=data.product_url,
            tone=data.tone,
            duration_seconds=data.duration_seconds,
            language=data.language,
            variants=data.variants,
        )
        
        # Deduct tokens
        await wallet_service.spend_tokens(
            user_id=user.id,
            amount=tokens_cost,
            description=f"Script generation ({data.tone} tone, {data.variants} variants)",
            action_type="SCRIPT",
        )
        
        return ScriptGenerateResponse(
            scripts=scripts,
            tokens_spent=tokens_cost,
            tone=data.tone,
            duration_seconds=data.duration_seconds,
            language=data.language,
            variants_count=len(scripts),
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
    
    Costs 2 tokens per generation.
    """
    tokens_cost = settings.cost_hashtag_suggestion
    
    # Check balance
    wallet_service = WalletService(db)
    has_balance = await wallet_service.check_balance(user.id, tokens_cost)
    if not has_balance:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient tokens. Required: {tokens_cost}",
        )
    
    try:
        # Generate hashtags
        hashtags = await text_generator.generate_hashtags(
            product_description=data.product_description,
            count=data.count,
        )
        
        # Deduct tokens
        await wallet_service.spend_tokens(
            user_id=user.id,
            amount=tokens_cost,
            description="Hashtag generation",
            action_type="SCRIPT",
        )
        
        return HashtagGenerateResponse(
            hashtags=hashtags,
            tokens_spent=tokens_cost,
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
    
    Costs 3 tokens per suggestion.
    """
    tokens_cost = settings.cost_audience_suggestion
    
    # Check balance
    wallet_service = WalletService(db)
    has_balance = await wallet_service.check_balance(user.id, tokens_cost)
    if not has_balance:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient tokens. Required: {tokens_cost}",
        )
    
    try:
        # Generate suggestions
        result = await text_generator.suggest_audience(
            product_description=data.product_description,
        )
        
        # Deduct tokens
        await wallet_service.spend_tokens(
            user_id=user.id,
            amount=tokens_cost,
            description="Audience suggestion",
            action_type="TARGETING",
        )
        
        return AudienceSuggestResponse(
            age_range=result["age_range"],
            gender=result["gender"],
            interests=result["interests"],
            locations=result["locations"],
            description=result["description"],
            tokens_spent=tokens_cost,
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
    
    Costs 5 tokens per generation.
    """
    tokens_cost = settings.cost_marketing_description
    
    # Check balance
    wallet_service = WalletService(db)
    has_balance = await wallet_service.check_balance(user.id, tokens_cost)
    if not has_balance:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient tokens. Required: {tokens_cost}",
        )
    
    try:
        # Generate description
        description = await text_generator.generate_marketing_description(
            product_description=data.product_description,
            language=data.language,
        )
        
        # Deduct tokens
        await wallet_service.spend_tokens(
            user_id=user.id,
            amount=tokens_cost,
            description="Marketing description generation",
            action_type="SCRIPT",
        )
        
        return MarketingDescriptionResponse(
            description=description,
            tokens_spent=tokens_cost,
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
    
    Costs 5 tokens per generation.
    """
    tokens_cost = settings.cost_kling_prompt
    
    # Check balance
    wallet_service = WalletService(db)
    has_balance = await wallet_service.check_balance(user.id, tokens_cost)
    if not has_balance:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient tokens. Required: {tokens_cost}",
        )
    
    try:
        # Generate prompt
        prompt = await text_generator.generate_kling_prompt(
            product_description=data.product_description,
            language=data.language,
        )
        
        # Deduct tokens
        await wallet_service.spend_tokens(
            user_id=user.id,
            amount=tokens_cost,
            description="Kling AI prompt generation",
            action_type="SCRIPT",
        )
        
        return KlingPromptResponse(
            prompt=prompt,
            tokens_spent=tokens_cost,
        )
        
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
