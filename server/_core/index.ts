import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getDb } from "../db";
import { syncBtcDeposits } from "../btc-provider";
import { applySecurityHeaders, createCsrfProtection, createRateLimiter, issueCsrfToken } from "./security";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 600, message: "Too many requests. Please wait a moment and try again." });
  const csrfProtection = createCsrfProtection({});

  app.disable("x-powered-by");
  app.use((req, res, next) => applySecurityHeaders(req as any, res as any, next));
  app.use((req, res, next) => {
    if (req.path === "/api/csrf") return next();
    rateLimiter(req as any, res as any, next);
  });
  app.get("/api/csrf", (req, res) => {
    const token = issueCsrfToken(req as any, res as any, true);
    res.status(200).json({ csrfToken: token });
  });
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    (req, res, next) => csrfProtection(req as any, res as any, next),
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    const syncBtc = async () => {
      const db = await getDb();
      if (!db) return;
      try {
        await syncBtcDeposits(db);
      } catch (error) {
        console.warn("[BTC] Background deposit monitor unavailable:", error);
      }
    };
    void syncBtc();
    setInterval(() => void syncBtc(), 30_000);
  });
}

startServer().catch(console.error);
