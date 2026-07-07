import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import productRoutes from './product.routes';

const router = Router();

// ── Auth ───────────────────────────────────────────────────────
router.use('/auth', authRoutes);

// ── User Management (Admin Only) ──────────────────────────────
router.use('/users', userRoutes);

// ── Product Management (Admin Only) ───────────────────────────
router.use('/products', productRoutes);

export default router;
