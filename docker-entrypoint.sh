#!/bin/sh
set -e

echo "[entrypoint] prisma migrate deploy..."
node node_modules/prisma/build/index.js migrate deploy --skip-generate

exec "$@"
