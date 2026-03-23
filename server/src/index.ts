import cors from 'cors';
import express, { ErrorRequestHandler } from 'express';
import { resourcesRouter } from './routes/resources';
import { workloadRouter } from './routes/workload';
import { config } from './config';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/resources', resourcesRouter);
app.use('/api/workload', workloadRouter);

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const details = config.nodeEnv === 'development' && error instanceof Error ? error.stack : undefined;

  res.status(500).json({
    message,
    details
  });
};

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});