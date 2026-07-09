import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import path from "path";

import modernRoutes from "@/routes/modern.routes";
import { ApiError } from "@/utils/ApiError";

const app: Application = express();
// MongoDB has been replaced with Supabase. 
// Database connection is handled gracefully by the Supabase JS client.
// Seeders have been removed as data should be migrated or re-seeded via Supabase.

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/api/v1", modernRoutes);

app.use((_req, _res, next) => next(ApiError.notFound("Route not found")));
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
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
