import { Router } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { prisma } from '@devflow/db';
import { successResponse, errorResponse, estimateTokens } from '@devflow/shared';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../config/logger.js';
import { assertAiUsageAllowed } from '../services/planLimits.js';

export const docsRouter = Router();

const generateSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50000),
  language: z.string().min(1).max(50),
  style: z.enum(['jsdoc', 'docstring', 'markdown']),
});

/**
 * POST /api/v1/docs/generate
 * Generates documentation for a given code snippet using Claude AI.
 * Requires authentication.
 */
docsRouter.post(
  '/generate',
  requireAuth as any,
  aiRateLimiter,
  async (req: AuthenticatedRequest, res, next) => {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      const message =
        parsed.error.flatten().formErrors.join(', ') ||
        Object.values(parsed.error.flatten().fieldErrors).flat().join(', ') ||
        'Invalid request body';
      return res.status(400).json(errorResponse(message));
    }

    const { code, language, style } = parsed.data;
    const userId = req.user!.id;

    try {
      await assertAiUsageAllowed(req.user?.orgId, 'docs');
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

      const response = await axios.post(`${aiServiceUrl}/docs`, {
        code,
        language,
        style,
      });

      const result = response.data as {
        docs: string;
        coverage: number;
        functions: string[];
      };

      // Track token usage
      const tokensUsed = estimateTokens(code) + estimateTokens(result.docs);

      await prisma.docsGenerated.create({
        data: { userId, language, style, tokensUsed },
      });

      logger.info('Documentation generated', { userId, language, style, tokensUsed });

      res.json(successResponse(result));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        logger.error('AI service error', { status: err.response?.status, message: err.message });
        return next(new Error('AI service unavailable. Please try again later.'));
      }
      next(err);
    }
  }
);
