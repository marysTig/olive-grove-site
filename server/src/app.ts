import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "node:url";

import modernRoutes from "@server/routes/modern.routes";
import { ApiError } from "@server/utils/ApiError";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Application = express();
// Database connection is handled gracefully by the Supabase JS client.

// IMPORTANT VERCEL FIX: Normalize req.url so Express routes match correctly.
// Vercel sometimes strips the `/api` or alters the base URL depending on the route matching strategy.
app.use((req, _res, next) => {
  if (!req.url.startsWith("/api/v1") && req.url.startsWith("/v1")) {
    req.url = `/api${req.url}`;
  } else if (!req.url.startsWith("/api/v1") && !req.url.startsWith("/api")) {
    // If it's completely stripped, try to append it back based on what we expect
    req.url = `/api/v1${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  // Remove /api/server if it was set by a Vercel rewrite
  if (req.url.startsWith("/api/server")) {
    req.url = req.url.replace("/api/server", "/api/v1");
  }
  next();
});

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://olive-grove-site.vercel.app",
];

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, Postman, same-origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/api/v1", modernRoutes);

app.use((_req, _res, next) => next(ApiError.notFound("Route not found")));
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
        success: false,
        statusCode: err.statusCode,
        message: err.message,
      });
    }

    console.error(err);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error",
    });
  },
);

export default app;
