import BaseRepository from './base.repository.js';
import { AiUsageLog } from '../models/aiUsageLog.model.js';

class AiUsageLogRepository extends BaseRepository {
  constructor() {
    super(AiUsageLog);
  }

  async summaryByModule({ from, to } = {}) {
    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = from;
      if (to) match.createdAt.$lte = to;
    }
    return this.model.aggregate([
      ...(Object.keys(match).length ? [{ $match: match }] : []),
      {
        $group: {
          _id: '$module',
          calls: { $sum: 1 },
          totalTokens: { $sum: '$totalTokens' },
          costUsd: { $sum: '$estimatedCostUsd' },
          avgLatencyMs: { $avg: '$latencyMs' },
          failures: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        },
      },
      { $sort: { costUsd: -1 } },
    ]);
  }

  totalsForUser(userId) {
    return this.model.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          calls: { $sum: 1 },
          totalTokens: { $sum: '$totalTokens' },
          costUsd: { $sum: '$estimatedCostUsd' },
        },
      },
    ]);
  }
}

export const aiUsageLogRepository = new AiUsageLogRepository();
export default aiUsageLogRepository;
