# 🚀 ITFest 2026: Campaia pentru Comunități - Project Context

> **Last Updated:** 13-03-2026
> **Purpose:** Comprehensive context document for the community-focused migration of Campaia

---

## 📋 What is this project?

This repository contains the **ITFest 2026** version of **Campaia**, a platform specifically adapted for social and community initiatives (NGOs, local projects, blood donation campaigns, etc.). Instead of targeting SMBs for commercial marketing, this version helps community organizers generate high-impact social media campaigns automatically using AI.

---

## 🏗️ Project Architecture

```
itfest2026/
├── campaia-engine/          # Backend (FastAPI, Python 3.12)
├── campaia-platform/        # Frontend (React 19, TypeScript, Vite)
├── docker-compose.yml       # Local development orchestration
├── scripts/                 # Development scripts
└── PROJECT_CONTEXT.md       # This file
```

---

## 🔧 Tech Stack

### Backend (`campaia-engine`)
| Component | Technology |
|-----------|------------|
| Framework | FastAPI 0.121+ |
| Language | Python 3.12 |
| Database | PostgreSQL 16 (async with asyncpg) |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Cache | Redis 7 |
| Auth | JWT (python-jose) + Google OAuth |
| Package Manager | Poetry |

### Frontend (`campaia-platform`)
| Component | Technology |
|-----------|------------|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS 4 |
| Auth | @react-oauth/google |

### Core AI & Integrations
| Service | Purpose |
|---------|---------|
| Ollama | Local LLM for text / script generation |
| Kling AI | External API for text-to-video / image-to-video |
| AWS S3 | Object storage (LocalStack used for local dev) |
| Stripe | Payment processing (Token purchases) |

---

## 💡 System Workflow

1. **Authentication:** Organizers sign in using Google OAuth or Email.
2. **Token Purchase:** Organizers purchase "Tokens" via Stripe.
3. **Campaign Creation:** Users input basic community concepts (e.g., "Recycle Day in Park X").
4. **AI Generation:** The platform generates textual scripts, image assets, and a ready-to-post video.
5. **Targeting:** AI suggests specific demographics for reaching the ideal local audience.
6. **Publishing:** Integration hooks format output for social networks (TikTok live; Meta Ads & Google Ads coming soon).

---

## 🐳 Running Locally

```bash
# 1. Provide necessary env files
cp campaia-platform/.env.example campaia-platform/.env
# Update .env variables if necessary

# 2. Start the Docker stack
./scripts/dev-start.sh

# The stack includes: PostgreSQL, Redis, FastAPI Backend, React Frontend, and LocalStack.
```

---

## 🤖 For AI Assistants Working on ITFest 2026

When writing or modifying code in this repository:
1. Keep the focus on the **Community and NGO** context. Avoid language referencing "B2B", "Enterprise clients", or "E-commerce sales" in UI text.
2. Always execute changes matching the `campaia-engine` and `campaia-platform` respective structures.
3. Use Poetry for backend dependency changes.
4. Use NPM for frontend dependencies.
