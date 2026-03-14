# Campaia — ce rulează singur vs ce faci tu (pas cu pas)

## Ce am rulat deja (nu trebuie să repeți dacă e ok)

1. **Docker** — stack-ul e pornit cu `./scripts/dev-start.sh` (sau `docker compose up -d`).
2. **Migrații DB** — în container backend: `alembic upgrade head` (inclusiv câmpurile multi-provider video).

## Ce vezi tu în browser (fără API keys)

| URL | Rol |
|-----|-----|
| http://localhost:5173 | Frontend (aplicația) |
| http://localhost:8000/docs | API Swagger |
| http://localhost:8000/health | Health backend |

**Fără chei externe** poți: te loga (dacă ai DB curat, signup), naviga dashboard, unele ecrane vor arăta erori doar când apelezi AI/plăți/video real.

---

## Ce trebuie să faci TU (în ordine practică)

### Pas 0 — O singură dată: fișier `.env` la rădăcina proiectului

```bash
cd itfest2026
cp .env.example .env
```

Editezi `.env` cu un editor. Mai jos ce completezi **când** vrei fiecare funcție.

---

### Pas 1 — Google Login (opțional dar util)

1. Google Cloud Console → Credentials → OAuth 2.0 Client ID (Web).
2. Authorized JavaScript origins: `http://localhost:5173`
3. În **campaia-platform/.env** (sau root dacă copiezi pentru Vite):
   - `VITE_GOOGLE_CLIENT_ID=clientul-tău.apps.googleusercontent.com`

Frontend citește variabilele la build; după modificare, repornește containerul frontend:
```bash
docker compose up -d --build frontend
```
(sau din root `./scripts/dev-start.sh` după ce ai setat env-ul folosit de compose pentru frontend — verifică `docker-compose.yml` ce env primește frontendul.)

---

### Pas 2 — Ollama (scripturi AI, local) — recomandat pentru demo

1. Instalezi **Ollama** pe mașina ta (nu în Docker neapărat): https://ollama.com
2. `ollama pull llama3.2` (sau modelul din `campaia-engine` config).
3. Backend-ul din Docker trebuie să vadă Ollama:
   - Dacă Ollama rulează pe host la `localhost:11434`, în **docker-compose** backend e în `network_mode: host` pe Linux → deja poate accesa `localhost:11434`.
   - Pe Mac/Windows poate fi nevoie de `host.docker.internal` în setarea `OLLAMA_URL` (dacă o expui în compose).

Fără Ollama: generarea de scripturi poate eșua sau folosi fallback — depinde de cod.

---

### Pas 3 — Kling AI (video AI real)

1. Cont + API Key + Secret de la furnizorul Kling (conform documentației lor).
2. În `.env` la rădăcină:
   ```
   KLING_API_KEY=...
   KLING_API_SECRET=...
   ```
3. Repornește backend:
   ```bash
   docker compose up -d --build backend
   ```
Fără Kling: **video AI nu se generează**; stilurile „Cinematic/Social/Experimental” fac fallback logic la Kling — deci tot ai nevoie de Kling pentru clip final.

---

### Pas 4 — Stripe (cumpărare tokeni) — opțional local

1. Stripe Dashboard → Developers → API keys (test).
2. `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   ```
3. Frontend: `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`
4. Webhook local e mai complicat (ngrok etc.) — pentru demo poți folosi tokeni mock sau credit manual în DB.

---

### Pas 5 — TikTok Sandbox (publicare campanie)

1. TikTok for Developers + TikTok Ads Sandbox → **Access Token** + **Advertiser ID**.
2. `.env`:
   ```
   TIKTOK_ACCESS_TOKEN=...
   TIKTOK_ADVERTISER_ID=...
   TIKTOK_ENVIRONMENT=sandbox
   ```
3. Opțional: `TIKTOK_APP_ID`, `TIKTOK_APP_SECRET` dacă îți trebuie refresh token.
4. Repornește backend după modificare.

Fără TikTok: restul app-ului merge; butonul „Publică pe TikTok” va returna 503 sau eroare de API.

---

### Pas 6 — Runway / Pika / Stable Video (opțional)

Doar dacă vrei să nu mai cazi mereu pe Kling pentru stilurile respective:

```
RUNWAY_API_KEY=
PIKA_API_KEY=
STABLE_VIDEO_URL=
```

Lăsate goale → sistemul folosește automat **fallback pe Kling** (comportament intenționat, demo stabil).

---

## Comenzi pe care le poți rula oricând

```bash
cd itfest2026
./scripts/dev-start.sh          # pornește tot
docker compose ps               # status containere
docker exec itfest-backend alembic upgrade head   # migrații DB
docker compose logs -f backend  # debug backend
```

---

## Rezumat „minimum pentru demo convingător”

| Prioritate | Ce completezi |
|------------|----------------|
| 1 | `KLING_API_KEY` + `KLING_API_SECRET` → video AI |
| 2 | Ollama local → scripturi AI |
| 3 | `TIKTOK_ACCESS_TOKEN` + `TIKTOK_ADVERTISER_ID` → publicare sandbox |
| 4 | `VITE_GOOGLE_CLIENT_ID` → login rapid |
| 5 | Stripe → plăți test (opțional) |

**Tu nu ești obligat să rulezi Docker manual** dacă cineva ți-a pornit deja stack-ul; tu doar **editezi `.env`**, **repornești backend (și frontend dacă ai schimbat VITE_)**, și testezi în browser.
