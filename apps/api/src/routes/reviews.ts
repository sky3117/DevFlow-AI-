import { Router } from 'express';
import { prisma } from '@devflow/db';
import { successResponse, errorResponse } from '@devflow/shared';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../config/logger.js';

export const reviewsRouter = Router();

// Apply auth to all review routes
reviewsRouter.use(requireAuth as any);

/**
 * GET /api/v1/reviews
 * Returns review history for the authenticated user's organization
 */
reviewsRouter.get('/', apiRateLimiter, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { orgId } = req.user!;
    if (!orgId) {
      return res.status(403).json(errorResponse('User is not part of an organization'));
    }

    const page = parseInt(String(req.query.page ?? '1'), 10);
    const limit = parseInt(String(req.query.limit ?? '20'), 10);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { orgId } }),
    ]);

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      prUrl: r.prUrl,
      prNumber: r.prNumber,
      repoName: r.repoName,
      score: r.score,
      summary: r.summary,
      approved: r.approved,
      issueCount: Array.isArray(r.issuesJson) ? (r.issuesJson as any[]).length : 0,
      createdAt: r.createdAt.toISOString(),
    }));

    res.json(successResponse({ reviews: formattedReviews, total, page, limit }));
  } catch (err) {
    logger.error('Error fetching reviews', { error: (err as Error).message });
    next(err);
  }
});

/**
 * GET /api/v1/reviews/:id
 * Returns a single review by ID
 */
reviewsRouter.get('/:id', apiRateLimiter, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { orgId } = req.user!;
    const review = await prisma.review.findFirst({
      where: { id: req.params.id, orgId: orgId ?? undefined },
    });

    if (!review) {
      return res.status(404).json(errorResponse('Review not found'));
    }

    res.json(successResponse(review));
  } catch (err) {
    next(err);
  }
});
