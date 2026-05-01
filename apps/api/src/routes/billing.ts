import { Router } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@devflow/db';
import { PLAN_LIMITS, successResponse, errorResponse } from '@devflow/shared';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../config/logger.js';

export const billingRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const checkoutSchema = z.object({
  plan: z.enum(['starter', 'pro', 'enterprise']),
  seats: z
    .preprocess((value) => (value === undefined ? 1 : Number(value)), z.number().int().min(1))
    .default(1),
});

billingRouter.post(
  '/checkout',
  requireAuth as any,
  apiRateLimiter,
  async (req: AuthenticatedRequest, res, next) => {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      const message =
        parsed.error.flatten().formErrors.join(', ') ||
        Object.values(parsed.error.flatten().fieldErrors).flat().join(', ') ||
        'Invalid request body';
      return res.status(400).json(errorResponse(message));
    }

    try {
      const { plan, seats } = parsed.data;
      const orgId = req.user?.orgId;
      if (!orgId) {
        return res.status(403).json(errorResponse('User is not part of an organization'));
      }

      const planKey = plan.toUpperCase();
      const planLimits = PLAN_LIMITS[planKey];
      if (!planLimits) {
        return res.status(400).json(errorResponse('Unknown plan selected'));
      }

      if (planLimits.maxSeats !== Infinity && seats > planLimits.maxSeats) {
        return res
          .status(400)
          .json(errorResponse(`Seat limit for ${plan} plan is ${planLimits.maxSeats}`));
      }

      const priceId = getPriceId(plan);
      if (!priceId) {
        return res.status(500).json(errorResponse('Stripe price not configured'));
      }

      const successUrl = `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${process.env.FRONTEND_URL}/billing/cancel`;

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: seats }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: req.user?.email ?? undefined,
        client_reference_id: orgId,
        metadata: {
          orgId,
          plan: planKey,
          seats: String(seats),
        },
      });

      logger.info('Stripe checkout session created', { orgId, plan: planKey, seats });
      res.json(successResponse({ url: session.url }));
    } catch (err) {
      next(err);
    }
  }
);

billingRouter.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'] as string | undefined;
  if (!signature) {
    return res.status(400).json(errorResponse('Missing Stripe signature'));
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logger.warn('Stripe webhook signature verification failed', {
      error: (err as Error).message,
    });
    return res.status(400).json(errorResponse('Invalid Stripe signature'));
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.orgId;
      const plan = session.metadata?.plan;
      const seats = Number(session.metadata?.seats ?? '0');

      if (orgId && plan && seats > 0) {
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            plan: plan as any,
            seats,
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
            stripeSubscriptionId:
              typeof session.subscription === 'string' ? session.subscription : undefined,
          },
        });

        logger.info('Organization plan updated from Stripe', { orgId, plan, seats });
      } else {
        logger.warn('Stripe session missing metadata', { sessionId: session.id });
      }
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('Stripe webhook handler error', { error: (err as Error).message });
    res.status(500).json(errorResponse('Webhook processing failed'));
  }
});

function getPriceId(plan: 'starter' | 'pro' | 'enterprise'): string | undefined {
  switch (plan) {
    case 'starter':
      return process.env.STRIPE_STARTER_PRICE_ID;
    case 'pro':
      return process.env.STRIPE_PRO_PRICE_ID;
    case 'enterprise':
      return process.env.STRIPE_ENTERPRISE_PRICE_ID;
    default:
      return undefined;
  }
}
