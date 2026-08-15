import { userRepository } from '../repositories/user.repository.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * AI credit gate.
 *
 * Distinct from rate limiting: rate limits protect the SERVER from bursts, quotas
 * protect the BUDGET from sustained use. Both return 429, but for different reasons
 * and on different windows.
 *
 * The rolling reset happens here rather than in a cron job, so a user's quota
 * refreshes on their next request regardless of whether the scheduler ran.
 */
export const enforceAiQuota = asyncHandler(async (req, _res, next) => {
  const refreshed = await userRepository.resetCreditsIfDue(req.user._id);
  const user = refreshed ?? req.user;

  const requested = Array.isArray(req.body?.modules) ? req.body.modules.length : 1;
  const remaining = Math.max(user.aiCredits.limit - user.aiCredits.used, 0);

  if (remaining < requested) {
    const resetOn = user.aiCredits.resetAt?.toDateString() ?? 'your next billing cycle';
    throw ApiError.tooManyRequests(
      `AI credit limit reached. You need ${requested} credit(s) but have ${remaining}. Your quota resets on ${resetOn}.`,
      [
        {
          field: 'aiCredits',
          message: `${user.aiCredits.used} of ${user.aiCredits.limit} credits used`,
        },
      ]
    );
  }

  req.user = user;
  req.creditsRequested = requested;
  return next();
});

export default enforceAiQuota;
