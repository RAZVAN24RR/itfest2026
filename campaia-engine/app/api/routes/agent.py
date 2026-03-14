"""
Campaia Agent — AI Marketing Assistant powered by Google Gemini.

Provides a chat endpoint that acts as a marketing specialist,
helping users plan campaigns, optimize timing, and improve strategy.
"""

import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.services.campaign_service import CampaignService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["Campaia Agent"])

SYSTEM_PROMPT = """Ești Campaia Agent — un asistent AI expert în marketing digital și campanii comunitare.

Rolul tău:
- Ajuți utilizatorii să creeze, planifice și optimizeze campanii pe TikTok pentru cauze sociale
- Dai sfaturi despre timing-ul optim pentru lansarea campaniilor
- Recomanzi strategii de conținut, hashtag-uri și audiențe target
- Analizezi performanța campaniilor și sugerezi îmbunătățiri
- Planifici calendarul de campanii (când să pornești/oprești)
- Explici metrici: CPA, ROAS, reach, engagement
- Ești prietenos, concis și orientat pe acțiune

Context platformă:
- Campaia este o platformă pentru campanii comunitare (donare sânge, reciclare, voluntariat, etc.)
- Campaniile sunt publicate pe TikTok prin API
- Utilizatorii au un sistem de tokens pentru generare conținut AI
- Platformă dezvoltată în România, pentru comunități locale

Reguli:
- Răspunde în limba în care ți se scrie (română sau engleză)
- Fii concis dar util (max 200 cuvinte per răspuns)
- Când dai sfaturi de timing, folosește ore din fusul orar al României (EET/EEST)
- Dacă nu știi ceva specific despre platforma utilizatorului, întreabă
- Nu inventa statistici — dacă nu ai date concrete, spune clar
"""


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    campaign_context: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    suggestions: list[str] = []


@router.post("/chat", response_model=ChatResponse)
async def agent_chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    api_key = settings.gemini_api_key
    if not api_key or not api_key.strip():
        raise HTTPException(503, "Gemini API key not configured")

    # Build campaign context if user has campaigns
    campaign_summary = ""
    try:
        service = CampaignService(db)
        campaigns = await service.list_campaigns(current_user)
        if campaigns:
            lines = []
            for c in campaigns[:10]:
                lines.append(f"- {c.name} (status: {c.status}, budget: {c.budget} RON)")
            campaign_summary = "\n\nCampaniile utilizatorului:\n" + "\n".join(lines)
    except Exception:
        pass

    system = SYSTEM_PROMPT + campaign_summary
    if req.campaign_context:
        system += f"\n\nContext adițional: {req.campaign_context}"

    # Build Gemini contents
    contents = []
    for msg in req.history[-20:]:
        contents.append({
            "role": "user" if msg.role == "user" else "model",
            "parts": [{"text": msg.content}]
        })
    contents.append({"role": "user", "parts": [{"text": req.message}]})

    body = {
        "contents": contents,
        "systemInstruction": {"parts": [{"text": system}]},
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1024,
            "topP": 0.9,
        },
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=body)
            if resp.status_code != 200:
                logger.error("Gemini API error %d: %s", resp.status_code, resp.text[:500])
                raise HTTPException(502, f"Gemini API error: {resp.status_code}")

            data = resp.json()
            reply_text = data["candidates"][0]["content"]["parts"][0]["text"]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Gemini call failed: %s", e)
        raise HTTPException(502, f"Gemini API call failed: {e}")

    # Generate quick suggestions based on the reply
    suggestions = []
    if "campani" in req.message.lower() or len(req.history) == 0:
        suggestions = [
            "Ce oră e ideală pentru lansare?",
            "Cum optimizez bugetul?",
            "Ce hashtag-uri recomandzi?",
        ]

    return ChatResponse(reply=reply_text, suggestions=suggestions)
