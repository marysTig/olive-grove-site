import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

// Load .env file from server root (only in non-serverless environments)
try {
  dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
} catch {
  // In Vercel serverless, env vars are injected directly — this is fine
}

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().positive().default(5000),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters")
    .default("supersecret_jwt_key_that_is_at_least_32_characters_long"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_COOKIE_EXPIRES_IN: z.coerce.number().positive().default(7),

  // CORS
  CORS_ORIGIN: z
    .string()
    .default(
      "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,https://olive-grove-site.vercel.app",
    ),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(900000), // 15 min
  RATE_LIMIT_MAX: z.coerce.number().positive().default(100),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  CLOUDINARY_FOLDER: z.string().min(1).optional(),

  // Supabase
  SUPABASE_URL: z.string().url().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsed.error.format(), null, 2),
  );
  // In serverless environments, don't hard-exit — throw instead
  throw new Error("Invalid environment variables");
}

export const env: Env = parsed.data;
