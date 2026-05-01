import { PLAN_LIMITS } from '../types.js';

export type AiFeature = 'code_review' | 'docs';

export interface PlanLimitCheckInput {
  plan: string;
  seats: number;
  userCount: number;
  reviewCountThisMonth?: number;
  feature: AiFeature;
}

export interface PlanLimitCheckResult {
  allowed: boolean;
  reason?: string;
}

export function evaluatePlanLimits(input: PlanLimitCheckInput): PlanLimitCheckResult {
  const planKey = input.plan?.toUpperCase?.() ?? '';
  const planLimits = PLAN_LIMITS[planKey];

  if (!planLimits) {
    return { allowed: false, reason: 'Unknown subscription plan' };
  }

  if (!planLimits.features.includes(input.feature)) {
    return { allowed: false, reason: 'Feature not available on current plan' };
  }

  const maxSeatsAllowed =
    planLimits.maxSeats === Infinity
      ? input.seats
      : Math.min(planLimits.maxSeats, input.seats);

  if (input.userCount > maxSeatsAllowed) {
    return { allowed: false, reason: 'Seat limit exceeded for current plan' };
  }

  if (
    input.feature === 'code_review' &&
    planLimits.maxReviewsPerMonth !== null &&
    input.reviewCountThisMonth !== undefined &&
    input.reviewCountThisMonth >= planLimits.maxReviewsPerMonth
  ) {
    return { allowed: false, reason: 'Monthly review limit reached for current plan' };
  }

  return { allowed: true };
}
