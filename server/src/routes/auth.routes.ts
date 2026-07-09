import { Router } from "express";
import { login, logout, getMe, adminLogin } from "@server/controllers/auth.controller";
import { protect } from "@server/middlewares/auth.middleware";
import { validate } from "@server/middlewares/validate.middleware";
import { loginSchema } from "@server/validators/auth.validator";
import { loginLimiter } from "@server/config/loginLimiter.config";

const router = Router();

// POST /api/v1/auth/login
// Rate limited + validated
router.post("/login", loginLimiter, validate({ body: loginSchema }), login);

// POST /api/v1/auth/admin/login
router.post("/admin/login", loginLimiter, validate({ body: loginSchema }), adminLogin);

// POST /api/v1/auth/logout
router.post("/logout", logout);

// GET /api/v1/auth/me
// Protected — requires valid JWT
router.get("/me", protect, getMe);

export default router;
