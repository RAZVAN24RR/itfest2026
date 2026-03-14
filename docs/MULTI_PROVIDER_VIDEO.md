# Multi-AI video pipeline

- **UX styles** map to providers: KLING (fast), RUNWAY (cinematic), PIKA (social), STABLE_VIDEO (experimental).
- **Fallback**: two attempts on alternate provider; then **Kling** completes the job (9:16). User sees a short message if fallback ran.
- **Tokens**: base Kling cost × multiplier (Runway ~1.35, Stable ~0.55). Charged upfront for selected style.
- **DB migration**: `alembic upgrade head` (adds `video_provider`, `provider_used`, `fallback_used`, `aspect_ratio`, `generation_duration_ms`).
- **Optional env**: `RUNWAY_API_KEY`, `PIKA_API_KEY`, `STABLE_VIDEO_URL` — when empty, alternate path fails fast and Kling runs.

TikTok publish unchanged (public video URL).
