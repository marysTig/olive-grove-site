/**
 * Vercel Serverless Function — API adapter
 *
 * This file wraps the existing Express app so it runs as a single
 * Vercel serverless function. All /api/v1/* routes are forwarded here
 * via vercel.json rewrites.
 *
 * No controller or service code needs to change — Express handles everything.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { default: app } = await import("../server/src/app");
    // @ts-ignore
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel Serverless Boot Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Server failed to start",
      error: error?.message || String(error),
      stack: error?.stack
    });
  }
}
