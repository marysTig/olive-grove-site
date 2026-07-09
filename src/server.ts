import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// Lazy-load the Express app so it doesn't block startup
let expressAppPromise: Promise<{ default: (req: unknown, res: unknown) => void }> | undefined;
async function getExpressApp() {
  if (!expressAppPromise) {
    expressAppPromise = import("../server/src/app");
  }
  return expressAppPromise;
}

/**
 * Bridges a Web API Request → Express handler → Web API Response.
 * This lets the existing Express routes run inside the Cloudflare/Vercel
 * runtime without modifying any controller code.
 */
async function handleExpressRoute(request: Request): Promise<Response> {
  const { default: app } = await getExpressApp();

  return new Promise<Response>((resolve) => {
    // Build a minimal Node-like req/res from the Web API Request
    const url = new URL(request.url);

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let bodyBuffer: Buffer | undefined;
    const responseHeaders: Record<string, string> = {};
    let statusCode = 200;
    let responseBody = "";

    // Node-compatible shim objects
    const socket = { remoteAddress: "127.0.0.1" };

    const listeners: Record<string, Array<(chunk?: unknown) => void>> = {};

    const req = {
      method: request.method,
      url: url.pathname + url.search,
      originalUrl: url.pathname + url.search,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      headers,
      socket,
      connection: socket,
      ip: "127.0.0.1",
      cookies: {} as Record<string, string>,
      body: undefined as unknown,
      readable: true,
      read: () => null,
      on: (event: string, cb: (chunk?: unknown) => void) => {
        listeners[event] = listeners[event] ?? [];
        listeners[event].push(cb);
        return req;
      },
      removeListener: (event: string, cb: (chunk?: unknown) => void) => {
        listeners[event] = (listeners[event] ?? []).filter((fn) => fn !== cb);
        return req;
      },
      emit: (event: string, chunk?: unknown) => {
        for (const cb of listeners[event] ?? []) cb(chunk);
        return true;
      },
      pipe: () => req,
    };

    const res = {
      statusCode,
      setHeader: (key: string, value: string | string[]) => {
        responseHeaders[key] = Array.isArray(value) ? value.join(", ") : value;
      },
      getHeader: (key: string) => responseHeaders[key],
      removeHeader: (key: string) => {
        delete responseHeaders[key];
      },
      cookie: (name: string, value: string, options: { maxAge?: number; httpOnly?: boolean; path?: string; secure?: boolean; sameSite?: string } = {}) => {
        const parts = [`${name}=${encodeURIComponent(value)}`];
        if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
        if (options.path) parts.push(`Path=${options.path}`);
        if (options.httpOnly) parts.push("HttpOnly");
        if (options.secure) parts.push("Secure");
        if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
        const existing = responseHeaders["set-cookie"];
        responseHeaders["set-cookie"] = existing ? `${existing}, ${parts.join("; ")}` : parts.join("; ");
      },
      clearCookie: (name: string, options: { path?: string } = {}) => {
        const parts = [`${name}=`, "Max-Age=0"];
        if (options.path) parts.push(`Path=${options.path}`);
        const existing = responseHeaders["set-cookie"];
        responseHeaders["set-cookie"] = existing ? `${existing}, ${parts.join("; ")}` : parts.join("; ");
      },
      end: (body?: string | Buffer) => {
        responseBody = body ? body.toString() : "";
        resolve(
          new Response(responseBody || null, {
            status: res.statusCode,
            headers: responseHeaders,
          }),
        );
      },
      write: (chunk: string | Buffer) => {
        responseBody += chunk.toString();
        return true;
      },
      json: (data: unknown) => {
        responseHeaders["content-type"] = "application/json";
        responseBody = JSON.stringify(data);
        resolve(
          new Response(responseBody, {
            status: res.statusCode,
            headers: responseHeaders,
          }),
        );
      },
      status: (code: number) => {
        res.statusCode = code;
        return res;
      },
      send: (body: unknown) => {
        if (typeof body === "object") {
          responseHeaders["content-type"] = "application/json";
          responseBody = JSON.stringify(body);
        } else {
          responseBody = String(body ?? "");
        }
        resolve(
          new Response(responseBody, {
            status: res.statusCode,
            headers: responseHeaders,
          }),
        );
      },
    };

    // Load request body for POST/PATCH/PUT
    const processBody = async () => {
      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        const contentType = headers["content-type"] ?? "";
        if (contentType.includes("application/json")) {
          const text = await request.text();
          req.body = text ? JSON.parse(text) : {};
        } else {
          req.body = {};
        }
      } else {
        req.body = {};
        queueMicrotask(() => req.emit("end"));
      }

      (req as { _body?: boolean })._body = true;

      try {
        (app as (req: unknown, res: unknown) => void)(req, res);
      } catch (err) {
        console.error("Express handler error:", err);
        resolve(
          new Response(
            JSON.stringify({ success: false, statusCode: 500, message: "Internal server error" }),
            { status: 500, headers: { "content-type": "application/json" } },
          ),
        );
      }
    };

    processBody().catch((err) => {
      console.error("Body processing error:", err);
      resolve(
        new Response(
          JSON.stringify({ success: false, statusCode: 500, message: "Failed to process request body" }),
          { status: 500, headers: { "content-type": "application/json" } },
        ),
      );
    });
  });
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {\"unhandled\":true,\"message\":\"HTTPError\"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      // Intercept all /api/v1/* requests and route them to the Express app
      if (url.pathname.startsWith("/api/v1")) {
        return await handleExpressRoute(request);
      }

      // All other routes go through TanStack Start's SSR handler
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
