import { Router } from 'express';
import { getProvider } from '../services/providerFactory';

export const resourcesRouter = Router();

resourcesRouter.get('/', async (req, res, next) => {
  try {
    const mode = String(req.query.mode ?? 'db') as 'db' | 'ssrs';
    const provider = getProvider(mode);
    const resources = await provider.getResources();
    res.json(resources);
  } catch (error) {
    next(error);
  }
});