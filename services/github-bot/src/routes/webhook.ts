import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { logger } from '../config/logger.js';
import { handlePRWebhook } from '../handlers/prHandler.js';
import type { GitHubPREvent } from '@devflow/shared';

export const webhookRouter = Router();

/**
 * POST /webhook/github
 * Receives GitHub webhook events, verifies HMAC-SHA256 signature,
 * and dispatches to appropriate handlers.
 */
webhookRouter.post('/github', async (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const event = req.headers['x-github-event'] as string | undefined;
  const deliveryId = req.headers['x-github-delivery'] as string | undefined;

  if (!signature || !event) {
    logger.warn('Webhook missing required headers', { deliveryId });
    return res.status(400).json({ error: 'Missing required headers' });
  }

  // Verify signature
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('GITHUB_WEBHOOK_SECRET not set');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const rawBody = req.body as Buffer;
  const expectedSig =
    'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  // Timing-safe comparison to prevent timing attacks
  try {
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      logger.warn('Webhook signature mismatch', { deliveryId });
      return res.status(401).json({ error: 'Invalid signature' });
    }
  } catch {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // Acknowledge receipt immediately
  res.status(200).json({ received: true, deliveryId });

  logger.info('GitHub webhook received', { event, deliveryId });

  // Dispatch event handlers asynchronously
  try {
    if (event === 'pull_request') {
      const prEvent = payload as unknown as GitHubPREvent;
      if (['opened', 'reopened', 'synchronize'].includes(prEvent.action)) {
        await handlePRWebhook(prEvent);
      }
    }
  } catch (err) {
    logger.error('Webhook handler error', { event, deliveryId, error: (err as Error).message });
  }
});
