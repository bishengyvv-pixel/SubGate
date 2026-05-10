#!/bin/sh
set -e

echo "Running database migrations..."
pnpm exec prisma migrate deploy

echo "Starting server..."
node dist/main.js
