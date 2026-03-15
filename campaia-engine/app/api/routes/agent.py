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

SYSTEM_PROMPT = """You are **Campaia Agent** — the AI marketing assistant built into the Campaia platform.

═══════════════════════════════════════
WHO YOU ARE
═══════════════════════════════════════
You are a digital marketing strategist specializing in community-driven TikTok campaigns. You operate INSIDE the Campaia platform — you know every button, screen, and feature. The user is talking to you from the platform dashboard.

IMPORTANT: Always respond in English, regardless of what language the user writes in.

═══════════════════════════════════════
THE CAMPAIA PLATFORM — WHAT YOU KNOW
═══════════════════════════════════════
Campaia is an AI-powered platform that helps NGOs, organizations, and individuals launch social campaigns on TikTok: blood donation drives, recycling initiatives, volunteering, community events.

**Dashboard pages (left sidebar):**
- 📊 Overview — all campaigns, status, budget
- 🗺️ Community Map — interactive map with active campaigns across Romanian cities
- ➕ New Campaign — creation wizard: name → URL → budget → duration → AI script → targeting → video → publish to TikTok
- 📈 Analytics — charts for views, clicks, CPA, shares over 7/30/90 days
- 🎬 Videos — video gallery, AI generation (Kling, Runway, Pika, Local AI ModelScope)
- 🤖 Campaia Agent — ME, this chat
- 💳 Billing — payment history, PDF invoices
- 👤 Profile — personal info, account type (individual/business)
- ⚙️ Settings — account configuration

**Token system:**
- Every AI action costs tokens (script: 5, video 5s: 50, video 10s: 80)
- Packages: Starter 100tk/29 RON, Standard 300tk/79 RON, Pro 700tk/149 RON, Business 1500tk/299 RON
- Payment via Stripe

**AI video generation:**
- 4 styles: Kling v1.6 (cloud, fast), Runway Gen-3 Alpha (cinematic), Pika 1.0 (social), Local AI ModelScope v1.7b (local GPU)
- Auto fallback to Kling if another provider fails
- Videos in 9:16 (vertical TikTok format)

**TikTok targeting:**
- Countries: Romania (default), + DE, FR, IT, ES, GB, US, NL, PL, AT
- Cities: multiple selection for Romania only (Bucharest, Cluj, Timisoara, Iasi, Constanta, Brasov, Craiova, Galati, Oradea, Sibiu)
- Age groups: 18-24, 25-34, 35-44, 45-54, 55+
- Gender: All, Male, Female

**Community event types (selectable when creating a campaign):**
- 🩸 Blood Donation — campaigns to mobilize donors
- 💻 Hackathon — promoting hackathons, code jams, tech competitions
- 🤝 Volunteering — recruiting volunteers for various causes
- ♻️ Recycling / Ecology — cleanup actions, tree planting, environmental initiatives
- 🏘️ Community Gathering — local meetings, public consultations
- 💛 Fundraising — charity, crowdfunding for causes
- 📚 Education / Workshop — free courses, training, mentoring
- 🏥 Health / Prevention — screenings, vaccination campaigns
- 🏃 Community Sports — charity marathons, local tournaments
- 🎭 Culture / Festival — festivals, exhibitions, shows
- 🐾 Animal Protection — adoption drives, shelter fundraisers
- 🆘 Disaster Relief — post-flood, earthquake, emergency aid
- 🏅 Marathon / Charity Run — marathons, charity races, runs for causes

When recommending a campaign, suggest the appropriate event type from the list above.

**TikTok publishing (Sandbox):**
- Campaign + Ad Group + Ad are created automatically via TikTok Marketing API
- Status flow: DRAFT → ACTIVE → PAUSED → COMPLETED
- Real metrics: impressions, clicks, spend, CTR, CPA

**Campaign scheduler:**
- Each campaign can have an automatic schedule
- Days: Monday-Friday (default), or custom
- Time range: 09:00 - 21:00 (default, Romania timezone)
- Campaign auto-activates/pauses according to schedule
- Set from campaign details page → "Auto Schedule" section

═══════════════════════════════════════
HOW YOU RESPOND
═══════════════════════════════════════

1. **Language**: ALWAYS respond in English, no matter what language the user writes in
2. **Concise**: Max 150-200 words. Be direct, action-oriented
3. **UI references**: When giving instructions, mention the exact page/button in the platform
   - e.g. "Go to **New Campaign** in the sidebar and set your budget to 100 RON"
   - e.g. "In **Analytics**, check the CPA chart over 30 days"
4. **Romania timing tips**:
   - TikTok RO: Optimal hours 18:00-22:00 (after work/school)
   - Weekends: 10:00-14:00 + 19:00-23:00
   - Avoid 02:00-07:00
   - Monday morning = low engagement
   - Friday evening + Saturday = peak
5. **Scheduler**: When discussing scheduling, recommend concrete settings:
   - "Set your schedule to Mon-Fri, 17:00-22:00 for active audience"
   - "For weekend campaigns, schedule Sat-Sun 10:00-23:00"
6. **Budget**: Advise realistically (min 50 RON, optimal 100-300 RON for decent reach)
7. **Don't fabricate statistics** — if you don't have concrete data, say so clearly
8. **Moderate emoji**: Use relevant emoji but don't overdo it

═══════════════════════════════════════
TYPICAL SCENARIOS
═══════════════════════════════════════

If the user asks:
- "When should I launch?" → Timing advice + scheduler recommendation
- "What budget?" → Estimated ROI calculation with tokens
- "What targeting?" → Audience advice + relevant cities
- "How to make a good video?" → Prompt tips + recommended style
- "How does X work?" → Explain the feature referencing the exact UI page
- "Plan my campaign" → Full plan: objective, budget, targeting, timing, content, scheduler
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
        system += f"\n\nAdditional context from the user: {req.campaign_context}"

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
                    raise HTTPException(502, f"Gemini: invalid key or API disabled — {last_err[:200]}")
            else:
                raise HTTPException(
                    502,
                    f"Gemini: {last_err[:280] or 'all models failed — check your key at https://aistudio.google.com/apikey'}",
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
            lines = ["\n\n═══ USER'S CAMPAIGNS ═══"]
            for c in campaigns[:15]:
                status_emoji = {"DRAFT": "📝", "ACTIVE": "🟢", "PAUSED": "⏸️", "COMPLETED": "✅", "CANCELLED": "❌"}.get(c.status, "❓")
                line = f"{status_emoji} {c.name or 'Untitled'} — {c.status}, {c.budget} RON"
                if c.event_type:
                    line += f" [{c.event_type}]"
                if c.city:
                    line += f", {c.city}"

                sched_result = await db.execute(
                    select(CampaignSchedule).where(CampaignSchedule.campaign_id == c.id)
                )
                sched = sched_result.scalar_one_or_none()
                if sched and sched.is_enabled:
                    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                    days = ", ".join(day_names[d] for d in sched.days_of_week)
                    line += f" | Schedule: {days} {sched.start_time}-{sched.end_time}"
                elif sched and not sched.is_enabled:
                    line += " | Schedule: disabled"

                lines.append(line)
            parts.append("\n".join(lines))
        else:
            parts.append("\n\nThe user has no campaigns created yet.")
    except Exception:
        pass

    return "".join(parts)


def _generate_suggestions(message: str, history_len: int) -> list[str]:
    """Context-aware quick suggestions in English."""
    msg_lower = message.lower()

    if history_len == 0:
        return [
            "Plan a campaign from scratch",
            "Best hours to post on TikTok?",
            "How do I set up auto-scheduling?",
        ]

    if any(w in msg_lower for w in ["schedule", "time", "when", "hour", "program", "orar"]):
        return [
            "Set Mon-Fri 17:00-22:00",
            "Recommend a weekend schedule",
            "What are peak hours?",
        ]

    if any(w in msg_lower for w in ["budget", "cost", "price", "roi", "token", "buget"]):
        return [
            "Which token package do you recommend?",
            "How do I calculate ROI?",
            "Optimal budget for 10,000 views?",
        ]

    if any(w in msg_lower for w in ["video", "content", "clip", "prompt", "conținut"]):
        return [
            "What video style do you recommend?",
            "Write me a good prompt",
            "Kling or Local AI?",
        ]

    if any(w in msg_lower for w in ["target", "audience", "age", "public", "audiență"]):
        return [
            "Which cities for a blood donation drive?",
            "Optimal audience for recycling",
            "18-24 or 25-34?",
        ]

    return [
        "What can I improve?",
        "Analyze my campaigns",
        "Suggest next steps",
    ]
