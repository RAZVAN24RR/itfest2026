"""
Campaia Agent — AI Marketing Assistant powered by Google Gemini.
Deep integration with Campaia platform, campaign scheduler, and TikTok strategy.
"""

import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.campaign_schedule import CampaignSchedule
from app.services.campaign_service import CampaignService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["Campaia Agent"])

SYSTEM_PROMPT = """Ești **Campaia Agent** — asistentul AI de marketing integrat în platforma Campaia.

═══════════════════════════════════════
CINE EȘTI
═══════════════════════════════════════
Ești un strateg de marketing digital specializat pe campanii comunitare TikTok. Funcționezi INSIDE platforma Campaia — cunoști fiecare buton, ecran și funcționalitate. Utilizatorul vorbește cu tine din dashboard-ul platformei.

═══════════════════════════════════════
PLATFORMA CAMPAIA — CE ȘTII
═══════════════════════════════════════
Campaia e o platformă AI care ajută ONG-uri, organizații și oameni normali să lanseze campanii sociale pe TikTok: donare de sânge, reciclare, voluntariat, evenimente comunitare.

**Pagini din dashboard (sidebar stânga):**
- 📊 Privire Generală — toate campaniile, status, buget
- 🗺️ Harta Comunitară — hartă cu campaniile active pe orașe din România
- ➕ Campanie Nouă — wizard de creare: nume → URL → buget → durată → AI script → targeting → video → publicare TikTok
- 📈 Analitice — grafice cu views, clicks, CPA, shares pe 7/30/90 zile
- 🎬 Videoclipuri — galerie video, generare AI (Kling, Runway, Pika, Local AI ModelScope)
- 🤖 Campaia Agent — EU, chat-ul ăsta
- 💳 Facturare — istoric plăți, facturi PDF
- 👤 Profil — date personale, tip cont (individual/business)
- ⚙️ Setări — configurări cont

**Sistem de tokens:**
- Fiecare acțiune AI costă tokens (script: 5, video 5s: 50, video 10s: 80)
- Pachete: Starter 100tk/29 RON, Standard 300tk/79 RON, Pro 700tk/149 RON, Business 1500tk/299 RON
- Plata prin Stripe

**Generare video AI:**
- 4 stiluri: Kling v1.6 (cloud, rapid), Runway Gen-3 Alpha (cinematic), Pika 1.0 (social), Local AI ModelScope v1.7b (GPU local)
- Fallback automat pe Kling dacă alt provider eșuează
- Videoclipuri 9:16 (vertical TikTok)

**Targeting TikTok:**
- Țări: România (default), + DE, FR, IT, ES, GB, US, NL, PL, AT
- Orașe: selecție multiplă doar pentru România (București, Cluj, Timișoara, Iași, Constanța, Brașov, Craiova, Galați, Oradea, Sibiu)
- Grupe vârstă: 18-24, 25-34, 35-44, 45-54, 55+
- Gen: Toți, Bărbați, Femei

**Tipuri de evenimente comunitare (NOU — selectabile la creare campanie):**
- 🩸 Donare de Sânge — campanii pentru mobilizarea donatorilor
- 💻 Hackathon — promovare hackathoane, code jams, competiții tech
- 🤝 Voluntariat — recrutare voluntari pentru diverse cauze
- ♻️ Reciclare / Ecologie — acțiuni de curățenie, plantare, mediu
- 🏘️ Adunare Comunitară — ședințe locale, consultări publice
- 💛 Strângere de Fonduri — charity, crowdfunding pentru cauze
- 📚 Educație / Workshop — cursuri gratuite, traininguri, mentorare
- 🏥 Sănătate / Prevenție — screening-uri, campanii de vaccinare
- 🏃 Sport Comunitar — maratoane caritabile, turnee locale
- 🎭 Cultură / Festival — festivaluri, expoziții, spectacole
- 🐾 Protecția Animalelor — adopție, strângeri pentru adăposturi
- 🆘 Ajutor în Dezastre — ajutor post-inundații, cutremure, urgențe
- 🏅 Maraton / Cursă Caritabilă — maratoane, curse caritabile, alergări pentru cauze

Când recomanzi o campanie, sugerează tipul de eveniment potrivit din lista de mai sus.

**Publicare TikTok (Sandbox):**
- Campaign + Ad Group + Ad se creează automat prin TikTok Marketing API
- Status: DRAFT → ACTIVE → PAUSED → COMPLETED
- Metrici reale: impressions, clicks, spend, CTR, CPA

**Scheduler campanii (NOU):**
- Fiecare campanie poate avea un program automat
- Zile: Luni-Vineri (default), sau personalizat
- Interval orar: 09:00 - 21:00 (default, fus orar România)
- Campania se activează/pauză automat conform programului
- Se setează din pagina detalii campanie → secțiunea "Program Automat"

═══════════════════════════════════════
CUM RĂSPUNZI
═══════════════════════════════════════

1. **Limba**: Răspunzi în limba în care ți se scrie (română sau engleză)
2. **Concis**: Max 150-200 cuvinte. Fii direct, orientat pe acțiune
3. **Referințe UI**: Când dai instrucțiuni, menționează exact pagina/butonul din platformă
   - Ex: "Du-te la **Campanie Nouă** din sidebar și setează bugetul pe 100 RON"
   - Ex: "În **Analitice**, uită-te la graficul CPA pe 30 zile"
4. **Sfaturi timing România**:
   - TikTok RO: Ore optimale 18:00-22:00 (după muncă/școală)
   - Weekend: 10:00-14:00 + 19:00-23:00
   - Evită 02:00-07:00
   - Luni dimineață = engagement scăzut
   - Vineri seara + Sâmbătă = vârf
5. **Scheduler**: Când vorbești despre programare, recomandă setări concrete:
   - "Setează programul pe Luni-Vineri, 17:00-22:00 pentru audiență activă"
   - "Pentru campanii de weekend, programează Sâmbătă-Duminică 10:00-23:00"
6. **Budget**: Sfatuiește realistic (min 50 RON, optim 100-300 RON pentru reach decent)
7. **Nu inventa statistici** — dacă nu ai date concrete, zi clar
8. **Emoji moderat**: Folosește emoji relevant dar nu exagera

═══════════════════════════════════════
SCENARII TIPICE
═══════════════════════════════════════

Dacă utilizatorul întreabă:
- "Când să lansez?" → Sfat de timing + recomandare scheduler
- "Ce buget?" → Calcul ROI estimat cu tokens
- "Ce targeting?" → Sfat audiență + orașe relevante
- "Cum fac un video bun?" → Sfaturi prompt + stil recomandat
- "Cum funcționează X?" → Explici funcționalitatea cu referință la pagina exactă din UI
- "Planifică-mi campania" → Plan complet: obiectiv, buget, targeting, timing, conținut, scheduler
"""


class ChatMessage(BaseModel):
    role: str
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

    # Build rich campaign + schedule context
    live_context = await _build_live_context(db, current_user)

    system = SYSTEM_PROMPT + live_context
    if req.campaign_context:
        system += f"\n\nContext adițional de la utilizator: {req.campaign_context}"

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

    # Order: prefer stable 2.5 Flash (ListModels), then 2.0, then aliases / lite
    models_to_try = [
        settings.gemini_model.strip() or "gemini-2.5-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-flash-latest",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash-001",
    ]
    seen = set()
    models_to_try = [m for m in models_to_try if m and not (m in seen or seen.add(m))]

    last_err = ""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            for model_id in models_to_try:
                url = (
                    f"https://generativelanguage.googleapis.com/v1beta/models/"
                    f"{model_id}:generateContent?key={api_key}"
                )
                resp = await client.post(url, json=body)
                if resp.status_code == 200:
                    data = resp.json()
                    cands = data.get("candidates") or []
                    if not cands:
                        block = data.get("promptFeedback") or {}
                        last_err = block.get("blockReason") or "no candidates (safety filter?)"
                        logger.warning("Gemini empty candidates model=%s %s", model_id, last_err)
                        continue
                    parts = (cands[0].get("content") or {}).get("parts") or []
                    reply_text = None
                    for p in parts:
                        if isinstance(p, dict) and p.get("text"):
                            reply_text = p["text"]
                            break
                    if not reply_text:
                        last_err = "Empty model reply (thinking-only parts?)"
                        continue
                    break
                # Parse Google error body
                try:
                    err_j = resp.json().get("error") or {}
                    last_err = err_j.get("message") or resp.text[:300]
                except Exception:
                    last_err = resp.text[:300]
                logger.error("Gemini %s HTTP %s: %s", model_id, resp.status_code, last_err)
                if resp.status_code in (401, 403) and "API key" in (last_err or ""):
                    raise HTTPException(502, f"Gemini: cheie invalidă sau API dezactivat — {last_err[:200]}")
            else:
                raise HTTPException(
                    502,
                    f"Gemini: {last_err[:280] or 'toate modelele au eșuat — verifică cheia pe https://aistudio.google.com/apikey'}",
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Gemini call failed: %s", e)
        raise HTTPException(502, f"Gemini: {e!s}")

    suggestions = _generate_suggestions(req.message, len(req.history))
    return ChatResponse(reply=reply_text, suggestions=suggestions)


async def _build_live_context(db: AsyncSession, user: User) -> str:
    """Build live context from user's campaigns and schedules."""
    parts = []

    try:
        service = CampaignService(db)
        campaigns = await service.list_campaigns(user)
        if campaigns:
            lines = ["\n\n═══ CAMPANIILE UTILIZATORULUI ═══"]
            for c in campaigns[:15]:
                status_emoji = {"DRAFT": "📝", "ACTIVE": "🟢", "PAUSED": "⏸️", "COMPLETED": "✅", "CANCELLED": "❌"}.get(c.status, "❓")
                line = f"{status_emoji} {c.name or 'Fără nume'} — {c.status}, {c.budget} RON"
                if c.event_type:
                    line += f" [{c.event_type}]"
                if c.city:
                    line += f", {c.city}"

                # Check schedule
                sched_result = await db.execute(
                    select(CampaignSchedule).where(CampaignSchedule.campaign_id == c.id)
                )
                sched = sched_result.scalar_one_or_none()
                if sched and sched.is_enabled:
                    day_names = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"]
                    days = ", ".join(day_names[d] for d in sched.days_of_week)
                    line += f" | Program: {days} {sched.start_time}-{sched.end_time}"
                elif sched and not sched.is_enabled:
                    line += " | Program: dezactivat"

                lines.append(line)
            parts.append("\n".join(lines))
        else:
            parts.append("\n\nUtilizatorul nu are campanii create încă.")
    except Exception:
        pass

    return "".join(parts)


def _generate_suggestions(message: str, history_len: int) -> list[str]:
    """Context-aware quick suggestions."""
    msg_lower = message.lower()

    if history_len == 0:
        return [
            "Planifică-mi o campanie de la zero",
            "Ce ore sunt cele mai bune pe TikTok?",
            "Cum setez programul automat?",
        ]

    if any(w in msg_lower for w in ["program", "schedul", "orar", "timp", "când"]):
        return [
            "Setează Luni-Vineri 17:00-22:00",
            "Recomandă program de weekend",
            "Care sunt orele de vârf?",
        ]

    if any(w in msg_lower for w in ["buget", "cost", "preț", "roi", "token"]):
        return [
            "Ce pachet de tokens recomandzi?",
            "Cum calculez ROI-ul?",
            "Buget optim pentru 10.000 views?",
        ]

    if any(w in msg_lower for w in ["video", "conținut", "clip", "prompt"]):
        return [
            "Ce stil video recomandzi?",
            "Scrie-mi un prompt bun",
            "Kling sau Local AI?",
        ]

    if any(w in msg_lower for w in ["target", "audiență", "public", "vârstă"]):
        return [
            "Ce orașe targetez pentru donare sânge?",
            "Audiență optimă pentru reciclare",
            "18-24 sau 25-34?",
        ]

    return [
        "Ce pot îmbunătăți?",
        "Analizează campaniile mele",
        "Sugerează următorul pas",
    ]
