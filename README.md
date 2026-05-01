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
1. Copy `.env.example` to `.env` and fill in required values.
2. Copy `apps/web/.env.example` to `apps/web/.env` and set `VITE_API_URL` if needed.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start infra (Postgres + Redis):
   ```bash
   docker-compose up -d postgres redis
   ```
5. Run the services:
   ```bash
   npm run dev
   ```

## Services
- `apps/api`: Express API (auth, reviews, docs, billing)
- `services/ai`: FastAPI Claude wrapper
- `services/github-bot`: GitHub webhook handler
- `apps/web`: React + Vite dashboard
