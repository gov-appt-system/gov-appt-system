import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import servicesRouter from './routes/services';
import { logger } from './config/logger';

const app: Express = express();
const PORT = process.env.PORT ?? 3000;

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/services', servicesRouter);

// Global error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

export default app;
