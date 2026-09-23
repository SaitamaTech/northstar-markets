import { describe, expect, it, vi } from "vitest";
import { applySecurityHeaders, createCsrfProtection, createRateLimiter, getSecurityHeaders } from "./security";

describe("security headers", () => {
  it("builds a hardened header set", () => {
    const headers = getSecurityHeaders({ isHttps: true, hostname: "northstar-markets.vercel.app" });

    expect(headers["Strict-Transport-Security"]).toContain("max-age=31536000");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("no-referrer");
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
  });

  it("applies headers with middleware semantics", () => {
    const setHeader = vi.fn();
    const next = vi.fn();

    applySecurityHeaders(
      { headers: { host: "example.com" } } as any,
      { setHeader } as any,
      next,
    );

    expect(setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY");
    expect(next).toHaveBeenCalled();
  });

  it("rate limits repeated requests", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1, message: "Too many requests" });
    const next = vi.fn();
    const status = vi.fn().mockReturnValue({ json: vi.fn() });
    const setHeader = vi.fn();

    limiter({ ip: "1.2.3.4" } as any, { status, setHeader } as any, next);
    limiter({ ip: "1.2.3.4" } as any, { status, setHeader } as any, next);

    expect(status).toHaveBeenCalledWith(429);
  });

  it("rejects invalid CSRF tokens for mutation requests", () => {
    const csrf = createCsrfProtection({});
    const json = vi.fn();
    const next = vi.fn();
    const req = {
      method: "POST",
      protocol: "https",
      headers: {
        host: "northstar-markets.vercel.app",
        cookie: "__Host-csrf-token=abc123",
        origin: "https://northstar-markets.vercel.app",
        referer: "https://northstar-markets.vercel.app/dashboard",
      },
    } as any;

    csrf(req, { status: vi.fn().mockReturnValue({ json }) } as any, next);

    expect(json).toHaveBeenCalledWith({ error: "Invalid CSRF token" });
  });
});
