import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { reviewsRouter } from './routes/reviews.js';
import { docsRouter } from './routes/docs.js';
import { webhooksRouter } from './routes/webhooks.js';
import { billingRouter } from './routes/billing.js';
import { logger } from './config/logger.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// ─── Logging ──────────────────────────────────────────────────────────────
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ─── Body parsing (raw for webhook signature verification) ─────────────────
// Webhook route must get raw body for HMAC signature verification
app.use('/api/v1/webhooks/github', express.raw({ type: 'application/json' }));
app.use('/api/v1/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'devflow-api', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/docs', docsRouter);
app.use('/api/v1/webhooks', webhooksRouter);
app.use('/api/v1/billing', billingRouter);

// ─── Error handler (must be last) ─────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 DevFlow API running on port ${PORT}`);
});

export default app;
