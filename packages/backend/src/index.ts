import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import servicesRouter from './routes/services';
import assignmentsRouter from './routes/assignments';
import appointmentsRouter from './routes/appointments';
import adminRouter from './routes/admin';
import { logger } from './config/logger';

const app: Express = express();
const PORT = process.env.PORT ?? 3000;

// CORS middleware — supports multiple origins for Vercel preview deployments
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, health checks)
    if (!origin) return callback(null, true);

    // Exact match against allowed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow any Vercel preview URL for this project
    if (/^https:\/\/gov-appt-system-frontend.*\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
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
app.use('/api/services/:id/assignments', assignmentsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/admin', adminRouter);

// Global error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

export default app;
