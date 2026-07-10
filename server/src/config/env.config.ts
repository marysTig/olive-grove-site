import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

try {
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
} catch {
  // Vercel injects env vars directly
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().positive().default(5000),

  CORS_ORIGIN: z
    .string()
    .default(
      "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,https://olive-grove-site.vercel.app",
    ),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().positive().default(100),

  SUPABASE_URL: z.string().url().min(1),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  CLOUDINARY_FOLDER: z.string().min(1).optional(),

  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    JSON.stringify(parsed.error.format(), null, 2),
  );
  throw new Error("Invalid environment variables");
}

const data = parsed.data;

if (data.NODE_ENV === "production") {
  const missingCloudinary = [
    !data.CLOUDINARY_CLOUD_NAME ? "CLOUDINARY_CLOUD_NAME" : null,
    !data.CLOUDINARY_API_KEY ? "CLOUDINARY_API_KEY" : null,
    !data.CLOUDINARY_API_SECRET ? "CLOUDINARY_API_SECRET" : null,
  ].filter(Boolean);

  if (missingCloudinary.length > 0) {
    throw new Error(
      `Missing required Cloudinary environment variables in production: ${missingCloudinary.join(", ")}`,
    );
  }
}

export const env: Env = data;

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
  );
}
