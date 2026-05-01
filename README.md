# DevFlow AI - AI-Powered Developer Productivity Platform

DevFlow AI is a production-ready monorepo implementing an AI-powered developer productivity platform that automatically reviews pull requests, generates documentation, and scans for bugs using Claude AI.

## 🏗️ Architecture

```
devflow-ai/
├── apps/
│   ├── api/          # Node.js Express Backend (port 3001)
│   └── web/          # React 18 + Vite Frontend (port 3000)
├── services/
│   ├── ai-service/   # Python FastAPI AI Engine (port 8000)
│   └── github-bot/   # GitHub Webhook Handler (port 3002)
├── packages/
│   ├── db/           # Prisma ORM + Database Schema
│   └── shared/       # Shared TypeScript Types & Utilities
├── cli/              # DevFlow CLI Tool
└── docker-compose.yml
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15 (or use Docker)

### 1. Clone & Install

```bash
git clone https://github.com/sky3117/DevFlow-AI-.git
cd devflow-ai
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values:
# - ANTHROPIC_API_KEY (from console.anthropic.com)
# - GITHUB_CLIENT_ID & GITHUB_CLIENT_SECRET (GitHub OAuth App)
# - GITHUB_WEBHOOK_SECRET (generate with: openssl rand -hex 20)
# - DATABASE_URL (PostgreSQL connection string)
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
```

### 3. Start Infrastructure

```bash
docker-compose up -d postgres redis
```

### 4. Setup Database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed  # Optional: seed with test data
```

### 5. Start Development

```bash
npm run dev
# Or start services individually:
npm run dev -w apps/api        # API on port 3001
npm run dev -w apps/web        # Frontend on port 3000
npm run dev -w services/github-bot  # Bot on port 3002
cd services/ai && uvicorn app.main:app --reload  # AI on port 8000
```

## 🔑 Key Features

### ✅ Automated Code Review
1. Developer opens/updates a Pull Request on GitHub
2. GitHub webhook fires to DevFlow webhook endpoint
3. HMAC-SHA256 signature verified for security
4. PR diff fetched from GitHub API
5. Diff sent to Claude AI for analysis
6. Structured review posted as PR comment (score, issues, suggestions)
7. Review stored in PostgreSQL for history

### ✅ Auto Documentation Generation
- POST `/api/docs/generate` with code snippet
- Supports JSDoc, Python docstrings, and Markdown
- Token counting and batching for large files

### ✅ Bug Scanning
- CLI tool: `devflow scan ./src`
- API endpoint: `POST /api/scans`
- Risk scoring and issue categorization

### ✅ Multi-tenant SaaS
- GitHub OAuth authentication
- Organization-based access control
- Plan management (starter/pro/enterprise)

## 📋 API Reference

### Authentication
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/callback` - OAuth callback
- `POST /auth/logout` - Logout

### Reviews
- `GET /api/reviews` - List reviews for org
- `POST /api/reviews` - Create manual review
- `GET /api/reviews/:id` - Get review details

### Documentation
- `POST /api/docs/generate` - Generate documentation

### Webhooks
- `POST /webhooks/github` - GitHub webhook endpoint

## 🔒 Security

- GitHub webhook HMAC-SHA256 signature verification
- JWT session tokens
- Input validation with Zod
- Rate limiting on all endpoints
- Environment variable validation on startup

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| AI Service | Python, FastAPI, Anthropic Claude |
| Database | PostgreSQL 15, Prisma ORM |
| Cache | Redis 7 |
| Auth | NextAuth.js, GitHub OAuth |
| DevOps | Docker, Docker Compose |

## 📦 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Claude API key | ✅ |
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID | ✅ |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Secret | ✅ |
| `GITHUB_WEBHOOK_SECRET` | Webhook validation secret | ✅ |
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `REDIS_URL` | Redis connection string | ✅ |
| `NEXTAUTH_SECRET` | JWT signing secret | ✅ |
| `NEXTAUTH_URL` | Frontend URL | ✅ |
| `STRIPE_SECRET_KEY` | Stripe for billing | Phase 2 |

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
