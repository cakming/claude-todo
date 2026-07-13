#!/usr/bin/env bash
#
# Idempotent deploy script, run ON THE VM (invoked by Cloud Build over SSH, or
# manually). Pulls the latest main, installs deps, builds the frontend in place,
# and reloads the backend under PM2.
#
#   APP_DIR=/var/www/vibe-todo bash deploy/deploy.sh
#
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/vibe-todo}"
BRANCH="${DEPLOY_BRANCH:-main}"

cd "$APP_DIR"

echo "==> [1/4] Fetching latest ${BRANCH}"
git fetch --prune origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/${BRANCH}"

echo "==> [2/4] Installing backend production dependencies"
( cd backend && npm ci --omit=dev )

echo "==> [3/4] Building frontend (uses frontend/.env.production)"
( cd frontend && npm ci && npm run build )

echo "==> [4/4] Reloading backend via PM2"
# startOrReload starts the app if it isn't running yet, otherwise zero-downtime reload.
pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save

echo "==> Deploy complete. Backend health:"
curl -fsS http://127.0.0.1:3001/health && echo
