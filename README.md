# DevFlow AI

AI-powered developer productivity platform with automated code reviews, documentation generation,
and billing controls.

## MVP Features
- GitHub OAuth login
- GitHub webhook → AI code review → PR comment
- Review history dashboard
- Auto documentation API + UI
- Stripe billing with seat-based limits

## Local Development
### Prerequisites
- Node.js 18+
- Docker + Docker Compose (for Postgres/Redis, and optional AI service)
- Python 3.12+ (only if running the AI service locally)

### Setup
1. Copy and fill env files:
   - `.env.example` → `.env`
   - `apps/web/.env.example` → `apps/web/.env`
   - `services/ai/.env.example` → `services/ai/.env` (only if running AI locally)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start infra (Postgres + Redis):
   ```bash
   docker-compose up -d postgres redis
   ```
4. Run database migrations (optional seed):
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

### Start Services (Local Dev)
1. Start the AI service (choose one):
   - Docker:
     ```bash
     docker-compose up -d ai
     ```
   - Local Python:
     ```bash
     cd services/ai
     pip install -r requirements.txt
     uvicorn main:app --host 0.0.0.0 --port 8000
     ```
2. Start the Node services (API, Web, GitHub Bot):
   ```bash
   npm run dev
   ```

### Start Everything with Docker (Optional)
```bash
docker-compose up --build
```

### URLs / Ports
- Web: http://localhost:3000
- API: http://localhost:3001
- GitHub Bot: http://localhost:3002
- AI Service: http://localhost:8000

## Services
- `apps/api`: Express API (auth, reviews, docs, billing)
- `services/ai`: FastAPI Claude wrapper
- `services/github-bot`: GitHub webhook handler
- `apps/web`: React + Vite dashboard
