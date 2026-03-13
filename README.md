# 🌍 Campaia — AI pentru Mobilizarea Comunităților

## Problema

Multe inițiative comunitare, ONG-uri și proiecte locale nu reușesc să ajungă la oamenii potriviți.
Campaniile de donare de sânge, reciclare sau voluntariat pierd oportunități importante de a mobiliza
comunitatea din cauza lipsei de resurse și expertiză în marketing digital.

Într-o lume în care vizibilitatea online determină impactul social, această lipsă limitează eficiența proiectelor comunitare.

## Soluția

**Campaia** oferă o platformă bazată pe Inteligență Artificială care permite crearea rapidă a campaniilor
digitale pentru inițiative comunitare.

Cu doar câteva detalii despre campanie (scop, public țintă, locație), platforma generează automat:

- 📝 **Scripturi** pentru videoclipuri scurte
- 🖼️ **Imagini promoționale**
- 🎬 **Videoclipuri** gata de social media
- #️⃣ **Hashtag-uri** și strategii de distribuție
- 🎯 **Recomandări** pentru audiența țintă

Astfel, orice inițiativă comunitară poate lansa o campanie eficientă în câteva minute, fără a avea nevoie de expertiză în marketing digital.

## Inovație și Impact

Campaia nu doar generează conținut, ci și optimizează campaniile:

- 📊 Predicții privind reach-ul și engagement-ul
- 💡 Recomandări pentru maximizarea impactului
- 🗺️ Harta interactivă a campaniilor active, pentru vizualizarea mobilizării comunității

## Beneficii

- ⚡ Crearea rapidă de campanii virale, gata pentru social media
- 🧠 Acces la sugestii strategice pentru audiențe și distribuție
- ⏱️ Reducerea timpului și efortului necesar pentru marketing digital
- 📈 Monitorizarea impactului campaniilor prin vizualizare interactivă

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python 3.12), PostgreSQL 16, Redis 7, SQLAlchemy 2.0 |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| AI | Ollama (local LLM), Kling AI (video generation) |
| Payments | Stripe (token-based system) |
| Storage | AWS S3 (LocalStack for dev) |
| Deploy | Docker Compose |

## Quick Start

```bash
# Clone the repository
git clone git@github.com:RAZVAN24RR/itfest2026.git
cd itfest2026

# Start development environment
docker-compose up -d

# Backend: http://localhost:8000
# Frontend: http://localhost:5173
# API Docs: http://localhost:8000/docs
```

## Project Structure

```
itfest2026/
├── campaia-engine/          # Backend (FastAPI, Python 3.12)
├── campaia-platform/        # Frontend (React 19, TypeScript, Vite)
├── docker-compose.yml       # Local development orchestration
├── scripts/                 # Development scripts
└── README.md                # This file
```

## License

Proprietary — ITFest 2026
