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
  // Build process creates dist/ with both frontend and backend:
  // - vite build -> dist/ (index.html, assets/)
  // - esbuild -> dist/index.js (backend server)
  // 
  // In production: server runs from dist/index.js, frontend files are in same dist/
  // In development: server runs from server/index.ts, frontend files are in dist/
  
  let distPath: string;
  
  if (process.env.NODE_ENV === "production") {
    // Production: server (dist/index.js) and frontend files are both in dist/
    distPath = path.resolve(__dirname);
  } else {
    // Development: server runs from server/, client files are in dist/
    distPath = path.resolve(__dirname, "../dist");
  }

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  
  log(`📁 Serving static files from: ${distPath}`);
  
  // Log directory contents for debugging
  try {
    const files = fs.readdirSync(distPath);
    log(`📂 Found ${files.length} files/folders: ${files.slice(0, 10).join(', ')}${files.length > 10 ? '...' : ''}`);
  } catch (err) {
    log(`⚠️  Could not read directory contents: ${err}`);
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

