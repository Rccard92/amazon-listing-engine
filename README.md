# Amazon Listing Engine

Piattaforma full-stack (MVP) per ottimizzare inserzioni Amazon: backend **FastAPI**, database **PostgreSQL**, **SQLAlchemy 2**, migrazioni **Alembic**, validazione **Pydantic v2**, frontend **Next.js** + **TypeScript** e **Tailwind CSS**.

## Struttura del repository

```
amazon-listing-engine/
├── backend/                 # API FastAPI
│   ├── app/
│   ├── alembic/
│   ├── alembic.ini
│   └── requirements.txt
├── frontend/                # UI Next.js (App Router)
├── docker-compose.yml       # PostgreSQL locale
├── .env.example
└── README.md
```

## Prerequisiti

- Python 3.11+
- Node.js 20+
- Docker (opzionale, per PostgreSQL locale)

## Configurazione ambiente

1. Copia `.env.example` in `.env` nella root del progetto (stesso livello di `README.md`).
2. Allinea `DATABASE_URL` e `NEXT_PUBLIC_API_URL` al tuo ambiente.

Il backend legge `.env` dalla root o da `backend/` (vedi `app/core/config.py`).

## Database (PostgreSQL)

Avvio con Docker:

```bash
docker compose up -d
```

Applica le migrazioni:

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
```

## Backend (FastAPI)

```bash
cd backend
# con venv attivo
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Documentazione interattiva: `http://localhost:8000/docs`
- Health (liveness): `GET http://localhost:8000/api/v1/health`
- Health (readiness + DB): `GET http://localhost:8000/api/v1/health/ready`

## Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Apri `http://localhost:3000`. La dashboard mostra tre workflow principali (nuova inserzione con keywords/Helium10, miglioramento da URL, analisi concorrente) e lo stato dell’API.

## Comandi di verifica rapida

```bash
cd backend && pip install -r requirements.txt && python -c "from app.main import app; print(app.title)"
cd frontend && npm install && npm run lint && npm run build
```

## Prossimi passi suggeriti

- Implementare i servizi di dominio (`amazon_url_service`, `keyword_service`, …) come moduli dedicati con route sottili.
- Aggiungere test (pytest / Vitest) e CI.
- Configurare deploy su Railway (variabili `DATABASE_URL`, build frontend/backend).
