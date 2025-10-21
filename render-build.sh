#!/bin/bash
set -e

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building application..."
npm run build

echo "🗄️  Pushing database schema..."
npm run db:push

echo "✅ Build completed successfully!"
