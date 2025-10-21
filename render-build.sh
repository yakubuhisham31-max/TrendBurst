#!/bin/bash
set -e

echo "Building frontend..."
npm run build:client

echo "Building backend..."
npm run build:server

echo "Pushing database schema..."
npm run db:push || echo "Warning: Database push failed. Make sure DATABASE_URL is set in Render environment variables."

echo "Build completed successfully!"
