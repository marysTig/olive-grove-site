import { Router } from 'express';
import { login, logout, getMe, adminLogin } from '@/controllers/auth.controller';
import { protect } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { loginSchema } from '@/validators/auth.validator';
import { loginLimiter } from '@/config/loginLimiter.config';

const router = Router();

// POST /api/v1/auth/login
// Rate limited + validated
router.post(
  '/login',
  loginLimiter,
  validate({ body: loginSchema }),
  login
);

// POST /api/v1/auth/admin/login
router.post('/admin/login', loginLimiter, validate({ body: loginSchema }), adminLogin);

// POST /api/v1/auth/logout
router.post('/logout', logout);

// GET /api/v1/auth/me
// Protected — requires valid JWT
router.get('/me', protect, getMe);

export default router;
