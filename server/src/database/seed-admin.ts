/**
 * Admin Seed Script
 *
 * Creates the initial admin user if none exists in the database.
 * Run with: npx ts-node -r tsconfig-paths/register src/database/seed-admin.ts
 *
 * Uses environment variables:
 *   ADMIN_EMAIL    — admin email (default: admin@lem3ansra.dz)
 *   ADMIN_PASSWORD — admin password (default: Admin@123456)
 *   ADMIN_NAME     — admin full name (default: Administrateur)
 */
import { env } from "@/config/env.config";
import { connectDatabase, disconnectDatabase } from "@/database/connection";
import User from "@/models/User.model";
import { logger } from "@/utils/logger";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@lem3ansra.dz";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123456";
const ADMIN_NAME = process.env.ADMIN_NAME || "Administrateur";

async function seedAdmin(): Promise<void> {
  try {
    await connectDatabase();

    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      logger.info(`✅ Admin already exists: ${existingAdmin.email}`);
      logger.info("   Skipping seed. Delete the existing admin first if you want to recreate.");
      await disconnectDatabase();
      return;
    }

    // Create the admin user
    const admin = await User.create({
      fullName: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash: ADMIN_PASSWORD, // Will be hashed by the pre-save hook
      role: "admin",
      isActive: true,
    });

    logger.info("🎉 Admin user created successfully!");
    logger.info(`   Email:    ${admin.email}`);
    logger.info(`   Name:     ${admin.fullName}`);
    logger.info(`   Role:     ${admin.role}`);
    logger.info("");
    logger.info("⚠️  Change the default password immediately in production!");

    await disconnectDatabase();
  } catch (error) {
    logger.error("Failed to seed admin user:", error);
    process.exit(1);
  }
}

seedAdmin();
