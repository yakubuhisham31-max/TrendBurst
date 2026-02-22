#!/bin/bash
set -e

echo "🏗️  Building Trendz for production..."

# Step 1: Build client (frontend) with Vite
echo "⚛️  Building frontend with Vite..."
vite build

# Step 2: Copy built frontend to dist/public
echo "📂 Copying frontend to dist/public..."
mkdir -p dist/public
cp -r client/dist/* dist/public/

# Step 3: Bundle TypeScript backend with esbuild
echo "🔨 Bundling TypeScript backend with esbuild..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build complete! Run 'npm start' to start the production server."
echo "📦 Output:"
echo "   - Frontend: dist/public/"
echo "   - Backend: dist/index.js"
