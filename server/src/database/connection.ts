import mongoose from "mongoose";
import { env } from "@/config/env.config";
import { logger } from "@/utils/logger";

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || env.MONGODB_URI;
  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 5000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(mongoUri, {
        autoIndex: env.NODE_ENV !== "production",
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      logger.info("✅ MongoDB connected successfully");
      break;
    } catch (error) {
      logger.error(`❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`, error);

      if (attempt === MAX_RETRIES) {
        logger.error("💀 All MongoDB connection attempts exhausted. Exiting.");
        process.exit(1);
      }

      logger.info(`⏳ Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  // Connection event listeners
  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("⚠️  MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("🔄 MongoDB reconnected");
  });
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info("🔌 MongoDB disconnected gracefully");
};
