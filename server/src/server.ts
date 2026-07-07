import { env } from '@/config/env.config';
import { logger } from '@/utils/logger';
import { connectDatabase, disconnectDatabase } from '@/database/connection';
import { autoSeedAdmin } from '@/database/auto-seed';
import app from '@/app';

// ── Start Server ───────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  try {
    // 1. Connect to MongoDB
    await connectDatabase();

    // Auto-seed default admin if none exists
    await autoSeedAdmin();

    // 2. Start listening
    const server = app.listen(env.PORT, () => {
      logger.info(
        `🚀 Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`
      );
    });

    // ── Graceful Shutdown ──────────────────────────────────────
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('🛑 HTTP server closed');
        await disconnectDatabase();
        logger.info('👋 Process exiting');
        process.exit(0);
      });

      // Force exit if graceful shutdown stalls
      setTimeout(() => {
        logger.error('⚠️  Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // ── Unhandled Errors ───────────────────────────────────────
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('UNHANDLED REJECTION 💥', reason);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('UNCAUGHT EXCEPTION 💥', error);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
