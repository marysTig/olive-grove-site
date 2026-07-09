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
import app from "../server/src/app";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // @ts-expect-error — VercelRequest/VercelResponse are compatible with Express req/res
  return app(req, res);
}
