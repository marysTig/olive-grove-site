import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { parseMultipartFile } from "../server/src/utils/multipart";

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
function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) continue;
    cookies[rawKey] = decodeURIComponent(rawValue.join("="));
  }

  return cookies;
}

function buildSetCookie(name: string, value: string, options: {
  maxAge?: number;
  httpOnly?: boolean;
  path?: string;
  secure?: boolean;
  sameSite?: string;
} = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join("; ");
}

async function handleExpressRoute(request: Request): Promise<Response> {
  const { default: app } = await getExpressApp();

  return new Promise<Response>((resolve) => {
    const url = new URL(request.url);

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const responseHeaders = new Headers();
    let statusCode = 200;
    let responseBody = "";
    let settled = false;

    const finish = (body: string | null = responseBody || null) => {
      if (settled) return;
      settled = true;
      resolve(
        new Response(body, {
          status: statusCode,
          headers: responseHeaders,
        }),
      );
    };

    const socket = {
      remoteAddress: "127.0.0.1",
      destroy: () => undefined,
      end: () => undefined,
    };

    const buildReqMetadata = () => ({
      method: request.method,
      url: url.pathname + url.search,
      originalUrl: url.pathname + url.search,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      headers,
      socket,
      connection: socket,
      ip: "127.0.0.1",
      cookies: parseCookieHeader(headers.cookie),
      body: undefined as unknown,
    });

    const createPlainReq = () => {
      const listeners: Record<string, Array<(chunk?: unknown) => void>> = {};
      const req = {
        ...buildReqMetadata(),
        file: undefined as import("express").Express.Multer.File | undefined,
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
      return req;
    };

    const res = {
      statusCode,
      setHeader: (key: string, value: string | string[]) => {
        const lower = key.toLowerCase();
        if (lower === "set-cookie") {
          const values = Array.isArray(value) ? value : [value];
          for (const entry of values) responseHeaders.append("Set-Cookie", entry);
          return;
        }
        responseHeaders.set(key, Array.isArray(value) ? value.join(", ") : value);
      },
      getHeader: (key: string) => responseHeaders.get(key) ?? undefined,
      removeHeader: (key: string) => {
        responseHeaders.delete(key);
      },
      appendHeader: (key: string, value: string) => {
        const lower = key.toLowerCase();
        if (lower === "set-cookie") {
          responseHeaders.append("Set-Cookie", value);
          return;
        }
        const existing = responseHeaders.get(key);
        responseHeaders.set(key, existing ? `${existing}, ${value}` : value);
      },
      cookie: (
        name: string,
        value: string,
        options: {
          maxAge?: number;
          httpOnly?: boolean;
          path?: string;
          secure?: boolean;
          sameSite?: string;
        } = {},
      ) => {
        responseHeaders.append("Set-Cookie", buildSetCookie(name, value, options));
      },
      clearCookie: (name: string, options: { path?: string } = {}) => {
        responseHeaders.append(
          "Set-Cookie",
          buildSetCookie(name, "", { ...options, maxAge: 0 }),
        );
      },
      end: (body?: string | Buffer) => {
        responseBody = body ? body.toString() : "";
        finish(responseBody || null);
      },
      write: (chunk: string | Buffer) => {
        responseBody += chunk.toString();
        return true;
      },
      json: (data: unknown) => {
        responseHeaders.set("content-type", "application/json");
        responseBody = JSON.stringify(data);
        finish(responseBody);
      },
      status: (code: number) => {
        statusCode = code;
        res.statusCode = code;
        return res;
      },
      send: (body: unknown) => {
        if (typeof body === "object" && body !== null) {
          responseHeaders.set("content-type", "application/json");
          responseBody = JSON.stringify(body);
        } else {
          responseBody = String(body ?? "");
        }
        finish(responseBody);
      },
    };

    const processBody = async () => {
      const contentType = headers["content-type"] ?? "";
      let req: ReturnType<typeof createPlainReq>;

      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        if (contentType.includes("multipart/form-data")) {
          req = createPlainReq();
          try {
            const buffer = Buffer.from(await request.arrayBuffer());
            req.file = await parseMultipartFile(buffer, contentType, "image");
            req.body = {};
          } catch (error) {
            const message = error instanceof Error ? error.message : "Invalid multipart upload";
            finish(JSON.stringify({ success: false, statusCode: 400, message }));
            return;
          }
        } else {
          req = createPlainReq();
          if (contentType.includes("application/json")) {
            const text = await request.text();
            req.body = text ? JSON.parse(text) : {};
          } else {
            req.body = {};
            queueMicrotask(() => req.emit("end"));
          }
        }
      } else {
        req = createPlainReq();
        req.body = {};
        queueMicrotask(() => req.emit("end"));
      }

      (req as { _body?: boolean })._body = true;

      try {
        (app as (request: unknown, response: unknown) => void)(req, res);
      } catch (err) {
        console.error("Express handler error:", err);
        if (!settled) {
          finish(
            JSON.stringify({ success: false, statusCode: 500, message: "Internal server error" }),
          );
        }
      }
    };

    processBody().catch((err) => {
      console.error("Body processing error:", err);
      if (!settled) {
        finish(
          JSON.stringify({ success: false, statusCode: 500, message: "Failed to process request body" }),
        );
      }
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
