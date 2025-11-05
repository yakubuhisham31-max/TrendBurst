import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  // In production (Render), the server is bundled to dist/index.js
  // and client files are in client/dist
  // In development, server runs from server/index.ts
  // and client files are in client/dist
  
  let distPath: string;
  
  if (process.env.NODE_ENV === "production") {
    // Production: server runs from /opt/render/project/src/dist/index.js
    // Client files are at /opt/render/project/src/client/dist
    distPath = path.resolve(__dirname, "../client/dist");
  } else {
    // Development: server runs from /home/runner/workspace/server/index.ts
    // Client files are at /home/runner/workspace/client/dist
    distPath = path.resolve(__dirname, "../client/dist");
  }

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Serve static files with cache control
  app.use(express.static(distPath, {
    setHeaders: (res, filepath) => {
      // Don't cache HTML files (always fetch latest)
      if (filepath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        // Cache other static assets (JS, CSS, images) for 1 hour
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    }
  }));

  // Fall through to index.html for SPA routing
  app.use("*", (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

