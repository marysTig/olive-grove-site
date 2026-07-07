import User from '@/models/User.model';
import { logger } from '@/utils/logger';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lem3ansra.dz';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrateur';

/**
 * Automatically initializes the database with a default admin user if none exists.
 * Does not manage database connection or process exits, making it safe to run in-app.
 */
export async function autoSeedAdmin(): Promise<void> {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      return;
    }

    const admin = await User.create({
      fullName: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash: ADMIN_PASSWORD, // Hashed automatically by mongoose pre-save hook
      role: 'admin',
      isActive: true,
    });

    logger.info('🎉 First-time automatic admin initialization successful!');
    logger.info(`   Name:     ${admin.fullName}`);
    logger.info(`   Email:    ${admin.email}`);
    logger.info(`   Role:     ${admin.role}`);
  } catch (error) {
    logger.error('❌ Failed to run automatic admin initialization:', error);
  }
}
