# TestApi - API Testing & Performance Analysis Platform

A modern full-stack monorepo designed for API functional testing, distributed load generation, and latency percentile analytics. Built as an engineering final-year project.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React icons.
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0 (async), asyncpg, Alembic, Pydantic v2, pydantic-settings.
- **Database**: PostgreSQL 16 (configured via Docker Compose).

---

## 📁 Repository Structure

```
TestApi/
├── docker-compose.yml          # PostgreSQL 16 local database service
├── .gitignore                  # Monorepo git ignore rules
├── README.md                   # Project documentation & runbook
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entry point & CORS configuration
│   │   ├── core/
│   │   │   ├── config.py       # Pydantic v2 BaseSettings configuration
│   │   │   └── database.py     # SQLAlchemy 2.0 async engine & session generator
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── api_router.py   # Aggregated v1 router
│   │   │       └── endpoints/
│   │   │           └── health.py   # GET /api/v1/health endpoint
│   │   ├── models/
│   │   │   └── __init__.py     # Declarative models package
│   │   └── schemas/
│   │       └── __init__.py     # Pydantic validation schemas
│   ├── requirements.txt        # Backend dependencies
│   ├── Dockerfile              # Containerized backend build
│   └── .env.example            # Backend environment variables
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx      # Dark mode root layout & typography
    │   │   ├── page.tsx        # Dashboard welcome card & live health ping
    │   │   └── globals.css     # Tailwind CSS base and theme tokens
    │   ├── components/
    │   │   └── Navbar.tsx      # Top navigation bar
    │   └── lib/
    │       └── api.ts          # API client with health check query
    ├── package.json            # Node.js dependencies & scripts
    ├── tsconfig.json           # TypeScript configuration
    ├── tailwind.config.ts      # Tailwind CSS theme configuration
    ├── postcss.config.js       # PostCSS configuration
    ├── next.config.mjs         # Next.js configuration
    └── .env.example            # Frontend environment variables
```

---

## 🚀 Quick Start Guide

### 1. Start the Database (PostgreSQL 16)

Ensure Docker Desktop is running, then run:

```bash
docker compose up -d db
```

- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `postgres`
- **Database**: `apitester_db`

---

### 2. Run the Backend (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   # Windows PowerShell:
   python -m venv .venv
   .venv\Scripts\Activate.ps1

   # Linux/macOS:
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment:
   ```bash
   cp .env.example .env
   ```

5. Start the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

- **API Base**: `http://localhost:8000`
- **Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/v1/health`

---

### 3. Run the Frontend (Next.js)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Configure environment:
   ```bash
   cp .env.example .env.local
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser. The dashboard will automatically ping the backend at `http://localhost:8000/api/v1/health` and display its live connection status.
