#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/ai-panorama-renovation-app}"
APP_PORT="${APP_PORT:-3002}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-change-this-password}"
OPENAI_API_KEY="${OPENAI_API_KEY:-}"
OPENAI_IMAGE_MODEL="${OPENAI_IMAGE_MODEL:-gpt-image-2}"
NEXT_PUBLIC_BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-/quanjing}"

if command -v sudo >/dev/null 2>&1; then
  SUDO=sudo
else
  SUDO=
fi

if ss -ltn "( sport = :${APP_PORT} )" | grep -q ":${APP_PORT}"; then
  if ! pm2 jlist 2>/dev/null | grep -q '"name":"ai-panorama-renovation"'; then
    echo "Port ${APP_PORT} is already occupied by another service. Aborting."
    exit 1
  fi
fi

$SUDO mkdir -p "$APP_ROOT"
$SUDO rsync -a --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude "data/*.db" \
  --exclude "data/*.db-wal" \
  --exclude "data/*.db-shm" \
  --exclude "public/uploads/*" \
  ./ "$APP_ROOT/"

$SUDO mkdir -p "$APP_ROOT/data" "$APP_ROOT/public/uploads"
cd "$APP_ROOT"

npm ci
export DATABASE_URL="file:../data/panorama.db"
export NEXT_PUBLIC_BASE_PATH
npx prisma generate
npx prisma db push
npm run seed
npm run build

cat > "$APP_ROOT/.env.production" <<EOF
DATABASE_URL=file:../data/panorama.db
NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}
ADMIN_USERNAME=${ADMIN_USERNAME}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
OPENAI_API_KEY=${OPENAI_API_KEY}
OPENAI_IMAGE_MODEL=${OPENAI_IMAGE_MODEL}
EOF

cat > "$APP_ROOT/pm2.ai-panorama.config.cjs" <<EOF
module.exports = {
  apps: [
    {
      name: "ai-panorama-renovation",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p ${APP_PORT}",
      cwd: "${APP_ROOT}",
      env: {
        NODE_ENV: "production",
        DATABASE_URL: "file:../data/panorama.db",
        NEXT_PUBLIC_BASE_PATH: "${NEXT_PUBLIC_BASE_PATH}",
        ADMIN_USERNAME: "${ADMIN_USERNAME}",
        ADMIN_PASSWORD: "${ADMIN_PASSWORD}",
        OPENAI_API_KEY: "${OPENAI_API_KEY}",
        OPENAI_IMAGE_MODEL: "${OPENAI_IMAGE_MODEL}"
      }
    }
  ]
};
EOF

pm2 start "$APP_ROOT/pm2.ai-panorama.config.cjs" --update-env
pm2 save

echo "App is running on 127.0.0.1:${APP_PORT}"
echo "Add deploy/nginx-ai-panorama-renovation.conf locations to the active Nginx server block, then run:"
echo "  sudo nginx -t && sudo systemctl reload nginx"
