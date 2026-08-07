#!/bin/sh
set -e

BACKEND_HOST="backend"
BACKEND_PORT="8000"
BACKEND_URL="http://${BACKEND_HOST}:${BACKEND_PORT}/health"

echo "Waiting for backend at $BACKEND_URL..."

while ! curl -s -f "$BACKEND_URL" > /dev/null; do
  echo "Backend not ready, waiting 2s..."
  sleep 2
done

echo "Backend is ready, starting Nginx..."
exec nginx -g "daemon off;"