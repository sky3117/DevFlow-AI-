import 'dotenv/config';
import express from 'express';
import { webhookRouter } from './routes/webhook.js';
import { logger } from './config/logger.js';

const app = express();
const PORT = process.env.GITHUB_BOT_PORT || 3002;

// Raw body required for HMAC-SHA256 signature verification
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'devflow-github-bot' });
});

app.use('/webhook', webhookRouter);

app.listen(PORT, () => {
  logger.info(`🤖 GitHub Bot service running on port ${PORT}`);
});
