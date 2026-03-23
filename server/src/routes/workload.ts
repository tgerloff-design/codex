import { Router } from 'express';
import { aggregateWeekly } from '../utils/aggregation';
import { workloadRequestSchema } from '../utils/validation';
import { getProvider } from '../services/providerFactory';

export const workloadRouter = Router();

workloadRouter.post('/', async (req, res, next) => {
  try {
    const parsed = workloadRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid request payload',
        issues: parsed.error.issues
      });
    }

    const payload = parsed.data;
    const provider = getProvider(payload.mode);
    const rows = await provider.getWorkItems(payload);

    const response = aggregateWeekly(rows, {
      startDate: payload.startDate,
      endDate: payload.endDate,
      selectedResourceIds: payload.resourceIds
    });

    return res.json(response);
  } catch (error) {
    next(error);
  }
});