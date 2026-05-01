import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { prisma } from '@devflow/db';
import { errorResponse } from '@devflow/shared';
import { logger } from '../config/logger.js';
import { handlePullRequestEvent } from '../services/prReviewService.js';
import type { GitHubPREvent } from '@devflow/shared';

export const webhooksRouter = Router();

/**
 * POST /api/v1/webhooks/github
 *
 * GitHub webhook endpoint. The body must be received as raw Buffer so we can
 * verify the HMAC-SHA256 signature before parsing JSON.
 */
webhooksRouter.post('/github', async (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const event = req.headers['x-github-event'] as string | undefined;

  if (!signature || !event) {
    return res.status(400).json(errorResponse('Missing required GitHub webhook headers'));
  }

  // ── Signature verification ──────────────────────────────────────────────
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('GITHUB_WEBHOOK_SECRET is not configured');
    return res.status(500).json(errorResponse('Webhook secret not configured'));
  }

  const rawBody = req.body as Buffer;
  const expectedSig =
    'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  );

  if (!isValid) {
    logger.warn('Invalid webhook signature received');
    return res.status(401).json(errorResponse('Invalid webhook signature'));
  }

  // ── Parse payload ────────────────────────────────────────────────────────
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json(errorResponse('Invalid JSON payload'));
  }

  const deliveryId = req.headers['x-github-delivery'] as string;
  logger.info('Webhook received', { event, deliveryId });

  // Acknowledge immediately — process asynchronously
  res.status(200).json({ received: true });

  // ── Route events ─────────────────────────────────────────────────────────
  try {
    if (event === 'pull_request') {
      const prEvent = payload as unknown as GitHubPREvent;
      const relevantActions = ['opened', 'reopened', 'synchronize'];

      if (relevantActions.includes(prEvent.action)) {
        await handlePullRequestEvent(prEvent);
      }
    }

    // Log successful processing
    await prisma.webhookLog.create({
      data: { eventType: event, payload, status: 'PROCESSED' },
    });
  } catch (err) {
    logger.error('Webhook processing error', { event, error: (err as Error).message });

    await prisma.webhookLog.create({
      data: {
        eventType: event,
        payload,
        status: 'FAILED',
        error: (err as Error).message,
      },
    });
  }
});
