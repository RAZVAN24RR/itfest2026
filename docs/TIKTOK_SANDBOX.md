# TikTok Sandbox — publicare campanie (Campaia)

## Ce face deja produsul

1. **Campanie în app** — Creezi campania (New Campaign), ai script + targeting + **video** (generat sau din galerie).
2. **Video pe campanie** — În Campaign Details, campania trebuie să aibă un video cu URL public (S3); butonul „Publică pe TikTok” e activ doar cu video.
3. **API** — `POST /api/v1/tiktok/publish` cu `{ "campaign_id": "<uuid>" }` (JWT). Backend: upload video la TikTok → campanie → ad group → ad.

## Variabile backend (`.env` / Docker)

| Variabilă | Rol |
|-----------|-----|
| `TIKTOK_ACCESS_TOKEN` | Long-term token TikTok Marketing API |
| `TIKTOK_ADVERTISER_ID` | ID advertiser (același cont ca în Ads Manager) |
| `TIKTOK_APP_ID` / `TIKTOK_APP_SECRET` | App developer (dacă e nevoie la refresh) |
| `TIKTOK_ENVIRONMENT` | `sandbox` → `https://sandbox-ads.tiktok.com/open_api/v1.3` |

## Flux demo (hackathon)

1. Pornește stack-ul: `./scripts/dev-start.sh`
2. Integrations → verifică **Connected** + **Environment: SANDBOX**
3. Creează campanie cu video finalizat → Campaign Details → **Publică pe TikTok**
4. Verifică în **TikTok Ads Manager** (sandbox) campaniile listate; în app apare `tiktok_campaign_id`.

## Dacă publicarea eșuează

- Video trebuie să fie **URL HTTPS** accesibil de TikTok (nu localhost).
- Cont sandbox + token cu scope-uri pentru campanii / asset video.
- Mesajul de eroare din API răspuns / logs backend (`tiktok_ad_publisher`).
