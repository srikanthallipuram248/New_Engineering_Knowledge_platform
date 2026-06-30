# Engineering Knowledge Platform

Two AI agents over one private knowledge base. Upload your repos and documents,
then ask questions and get answers grounded in **your** content — not the open
internet.

- **Agent 1 — Repo Analyzer:** ingests and indexes GitHub repositories.
- **Agent 2 — Knowledge Library:** chat that answers from your uploaded
  documents, with source citations.

Stack: FastAPI · React + TypeScript · LangGraph · Qdrant · PostgreSQL · Groq
(Llama 3.3 70B) · Docker.

---

## Quick start (first time)

You need **Docker Desktop** running. Everything else runs in containers.

### 1. Clone and enter the project

```bash
git clone <repo-url>
cd New_Engineering_Knowledge_platform
```

### 2. Create your `.env`

The app needs secrets that are **not** in git. Copy the template and fill it in:

```bash
cp .env.example .env
```

Then open `.env` and set at minimum:

| Key | What to put |
|-----|-------------|
| `GROQ_API_KEY` | Your Groq API key (get one free at https://console.groq.com) |
| `JWT_SECRET_KEY` | Any long random string |
| `POSTGRES_PASSWORD` | Any password (must match `docker-compose.yml` if you changed it) |

> Ask a teammate to share the working `.env` values directly if you don't have a
> Groq key.

### 3. Start everything

```bash
docker compose up --build -d
```

This starts Postgres, Qdrant, the API, and the web app. The database tables are
created automatically on first start — **no manual migration needed for a fresh
database.** The first run also downloads the embedding model (~90 MB), so the
first question may take a few extra seconds.

### 4. Create an account

Open **http://localhost:5173** and click **Create account**. Register at least
one user — the seed step in the next section attributes the sample docs to the
first user in the database.

### 5. Seed the sample knowledge base (recommended)

A fresh install has an **empty** knowledge base, so Agent 2 will answer
"I don't know based on the uploaded documents" until you add content. Load 60+
ready-made engineering docs (Python, React, FastAPI, Docker, Redis, JWT, SQL,
Kubernetes, CI/CD, and more):

```bash
docker exec ekp-api python seed_knowledge.py
```

It's safe to re-run — it skips documents that already exist.

### 6. Use it

- **http://localhost:5173** — the app
- **http://localhost:8000/docs** — API docs

Ask Agent 2 something like *"How do I implement JWT auth in FastAPI?"* — you
should get an answer with a green **"Answered from uploaded documents"** badge
and clickable source cards.

---

## Daily use (after first setup)

```bash
docker compose up -d        # start
docker compose down         # stop
docker compose logs -f api  # watch API logs
```

---

## Troubleshooting

**`column users.is_active does not exist` (or similar) on login/chat**
You have an **old database** from before the latest schema. Either run the
migrations or reset the volume:

```bash
docker exec ekp-api alembic upgrade head     # keep data, apply changes
# ── or, to wipe and start fresh: ──
docker compose down -v && docker compose up --build -d
```

**Chat says "I don't know based on the uploaded documents"**
Your knowledge base is empty. Run the seed step (5) or upload documents in the
Library page.

**API container won't start**
You're probably missing `.env`. See step 2.

**Chat returns "Internal Server Error" right after pulling**
Rebuild so the container picks up the latest code:
`docker compose up --build -d`.

---

## Project layout

```
apps/
  api/    FastAPI backend, LangGraph agents, RAG, Alembic migrations
  web/    React + TypeScript frontend
docker-compose.yml
.env.example
```
