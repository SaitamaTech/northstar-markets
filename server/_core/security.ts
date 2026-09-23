import crypto from "node:crypto";
import { parse as parseCookieHeader } from "cookie";

export const CSRF_COOKIE_NAME = "__Host-csrf-token" as const;
export const CSRF_HEADER_NAME = "x-csrf-token" as const;

type SecurityHeadersOptions = {
  isHttps: boolean;
  hostname?: string;
};

function readHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function getSecurityHeaders({ isHttps, hostname }: SecurityHeadersOptions) {
  const baseCsp = [
    "default-src 'self'",
    "base-uri 'self'",
    "block-all-mixed-content",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel.app",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
    "connect-src 'self' https://*.supabase.co https://*.vercel.app https://api.coingecko.com https://blockstream.info https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org",
    "frame-src 'self' https://*.supabase.co https://*.walletconnect.com https://*.walletconnect.org",
    "upgrade-insecure-requests",
  ].join("; ");

  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Content-Security-Policy": baseCsp,
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Referrer-Policy": "no-referrer",
    "Strict-Transport-Security": isHttps ? "max-age=31536000; includeSubDomains; preload" : "max-age=0",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Permitted-Cross-Domain-Policies": "none",
    "X-XSS-Protection": "0",
    ...(hostname ? { "X-Forwarded-Host": hostname } : {}),
  } as Record<string, string>;
}

export function applySecurityHeaders(req: { protocol?: string; headers?: Record<string, string | string[] | undefined>; hostname?: string }, res: { setHeader: (name: string, value: string) => void }, next: () => void) {
  const forwardedProto = Array.isArray(req.headers?.["x-forwarded-proto"]) ? req.headers["x-forwarded-proto"][0] : req.headers?.["x-forwarded-proto"];
  const protocol = req.protocol ?? forwardedProto ?? "http";
  const isHttps = protocol === "https";
  const hostname = req.hostname ?? (req.headers?.host ? String(req.headers.host) : undefined);
  const headers = getSecurityHeaders({ isHttps, hostname });

  for (const [name, value] of Object.entries(headers)) {
    if (name !== "X-Forwarded-Host") {
      res.setHeader(name, value);
    }
  }

  next();
}

export function getCsrfTokenFromRequest(req: { headers?: Record<string, string | string[] | undefined> }) {
  const cookieHeader = readHeader(req.headers?.cookie);
  const cookieFromHeader = parseCookieHeader(cookieHeader ?? "");
  return cookieFromHeader[CSRF_COOKIE_NAME] ?? null;
}

export function issueCsrfToken(req: { headers?: Record<string, string | string[] | undefined>; protocol?: string }, res: { cookie: (name: string, value: string, options: Record<string, unknown>) => void }, force = false) {
  const existingToken = getCsrfTokenFromRequest(req);
  const protocol = req.protocol ?? readHeader(req.headers?.["x-forwarded-proto"]) ?? "http";
  const secure = protocol === "https";

  if (existingToken && !force) return existingToken;

  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
  });
  return token;
}

export function createRateLimiter(options: { windowMs: number; maxRequests: number; message?: string }) {
  const seen = new Map<string, { count: number; resetAt: number }>();

  return (req: { ip?: string; headers?: Record<string, string | string[] | undefined> }, res: { status: (code: number) => { json: (body: Record<string, unknown>) => void }; setHeader: (name: string, value: string) => void }, next: () => void) => {
    const forwardedFor = readHeader(req.headers?.["x-forwarded-for"]);
    const key = (forwardedFor ?? req.ip ?? "unknown").split(",")[0].trim();
    const now = Date.now();
    const entry = seen.get(key);

    if (!entry || entry.resetAt <= now) {
      seen.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (entry.count >= options.maxRequests) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      res.status(429).json({ error: options.message ?? "Too many requests" });
      return;
    }

    entry.count += 1;
    next();
  };
}

export function createCsrfProtection(options: { headerName?: string; cookieName?: string; allowedMethods?: string[] }) {
  const headerName = options.headerName ?? CSRF_HEADER_NAME;
  const cookieName = options.cookieName ?? CSRF_COOKIE_NAME;
  const allowedMethods = new Set(options.allowedMethods ?? ["GET", "HEAD", "OPTIONS"]);

  return (req: { method?: string; headers?: Record<string, string | string[] | undefined>; protocol?: string }, res: { status: (code: number) => { json: (body: Record<string, unknown>) => void } }, next: () => void) => {
    if (!req.method || allowedMethods.has(req.method.toUpperCase())) {
      next();
      return;
    }

    const cookieHeader = readHeader(req.headers?.cookie);
    const cookieToken = parseCookieHeader(cookieHeader ?? "")[cookieName];
    const supplied = readHeader(req.headers?.[headerName]);
    const origin = readHeader(req.headers?.origin);
    const referer = readHeader(req.headers?.referer);
    const protocol = req.protocol ?? readHeader(req.headers?.["x-forwarded-proto"]) ?? "http";
    const requestHost = readHeader(req.headers?.host) ?? "";

    let originHost = "";
    if (origin) {
      try {
        originHost = new URL(origin).host;
      } catch {
        originHost = "";
      }
    }

    const validOrigin = !origin || originHost === requestHost || requestHost.startsWith("localhost") || requestHost.startsWith("127.0.0.1");
    const validReferer = !referer || referer.startsWith(`${protocol}://${requestHost}`) || referer.startsWith(`http://${requestHost}`) || requestHost.startsWith("localhost");

    if (!cookieToken || !supplied || cookieToken !== supplied || !validOrigin || !validReferer) {
      res.status(403).json({ error: "Invalid CSRF token" });
      return;
    }

    next();
  };
}
