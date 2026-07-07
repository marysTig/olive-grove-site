import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';

import { env } from '@/config/env.config';
import { corsOptions } from '@/config/cors.config';
import { rateLimiterOptions } from '@/config/rateLimiter.config';
import { errorHandler } from '@/middlewares/errorHandler';
import { notFoundHandler } from '@/middlewares/notFound.middleware';
import { ApiResponse } from '@/utils/ApiResponse';
import router from '@/routes';

// ── Create Express App ─────────────────────────────────────────
const app: Application = express();

// ── Security Middleware ────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));
app.use(rateLimiterOptions);
app.use(mongoSanitize());

// xss-clean does not ship with types — require it
// eslint-disable-next-line @typescript-eslint/no-var-requires
const xssClean = require('xss-clean');
app.use(xssClean());

// ── Body Parsers ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Logging ────────────────────────────────────────────────────
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Static Files ───────────────────────────────────────────────
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'))
);

// ── Health Check ───────────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  ApiResponse.success(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  }, 'Server is running');
});

// ── API Routes ─────────────────────────────────────────────────
app.use('/api/v1', router);

// ── Error Handling ─────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
