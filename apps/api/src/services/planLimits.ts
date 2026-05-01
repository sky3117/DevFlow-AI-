import { prisma } from '@devflow/db';
import { evaluatePlanLimits, type AiFeature } from '@devflow/shared';
import { createError } from '../middleware/errorHandler.js';

export async function assertAiUsageAllowed(
  orgId: string | undefined,
  feature: AiFeature
): Promise<void> {
  if (!orgId) {
    throw createError('User is not part of an organization', 403);
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, plan: true, seats: true },
  });

  if (!org) {
    throw createError('Organization not found', 404);
  }

  const [userCount, reviewCountThisMonth] = await Promise.all([
    prisma.user.count({ where: { orgId } }),
    feature === 'code_review'
      ? prisma.review.count({
          where: {
            orgId,
            createdAt: { gte: startOfCurrentMonth() },
          },
        })
      : Promise.resolve(undefined),
  ]);

  const result = evaluatePlanLimits({
    plan: org.plan,
    seats: org.seats,
    userCount,
    reviewCountThisMonth,
    feature,
  });

  if (!result.allowed) {
    throw createError(result.reason ?? 'Plan limits exceeded', 403);
  }
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}
