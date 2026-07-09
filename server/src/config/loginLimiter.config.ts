import rateLimit from "express-rate-limit";

/**
 * Strict rate limiter for the login endpoint.
 * 5 attempts per 15 minutes per IP — protects against brute-force attacks.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
  message: {
    success: false,
    statusCode: 429,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});
