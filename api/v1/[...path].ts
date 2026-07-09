/**
 * Vercel serverless fallback for /api/v1/* when not using Nitro Build Output.
 * The primary production path is Nitro __server (see vite.config nitro preset).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { default: app } = await import("../../server/src/app");
    // @ts-expect-error Express app is callable as a Vercel handler
    return app(req, res);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Vercel API boot error:", err);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Server failed to start",
      error: err?.message ?? String(error),
    });
  }
}
