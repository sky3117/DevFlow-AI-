import { prisma } from '@devflow/db';
import { evaluatePlanLimits } from '@devflow/shared';

export async function checkOrgReviewAccess(
  orgId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true, seats: true },
  });

  if (!org) {
    return { allowed: false, reason: 'Organization not found' };
  }

  const [userCount, reviewCountThisMonth] = await Promise.all([
    prisma.user.count({ where: { orgId } }),
    prisma.review.count({
      where: {
        orgId,
        createdAt: { gte: startOfCurrentMonth() },
      },
    }),
  ]);

  return evaluatePlanLimits({
    plan: org.plan,
    seats: org.seats,
    userCount,
    reviewCountThisMonth,
    feature: 'code_review',
  });
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}
