#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

if [ ! -f ".env.local" ]; then
  echo "ERROR: .env.local was not found."
  echo "Create the local database environment file before running Prisma."
  exit 1
fi

DATABASE_URL_WAS_SET=0
TEST_DATABASE_URL_WAS_SET=0
SHADOW_DATABASE_URL_WAS_SET=0

if [[ -n "${DATABASE_URL+x}" ]]; then
  DATABASE_URL_OVERRIDE="$DATABASE_URL"
  DATABASE_URL_WAS_SET=1
fi

if [[ -n "${TEST_DATABASE_URL+x}" ]]; then
  TEST_DATABASE_URL_OVERRIDE="$TEST_DATABASE_URL"
  TEST_DATABASE_URL_WAS_SET=1
fi

if [[ -n "${SHADOW_DATABASE_URL+x}" ]]; then
  SHADOW_DATABASE_URL_OVERRIDE="$SHADOW_DATABASE_URL"
  SHADOW_DATABASE_URL_WAS_SET=1
fi

set -a
source .env.local
set +a

if [[ "$DATABASE_URL_WAS_SET" -eq 1 ]]; then
  export DATABASE_URL="$DATABASE_URL_OVERRIDE"
fi

if [[ "$TEST_DATABASE_URL_WAS_SET" -eq 1 ]]; then
  export TEST_DATABASE_URL="$TEST_DATABASE_URL_OVERRIDE"
fi

if [[ "$SHADOW_DATABASE_URL_WAS_SET" -eq 1 ]]; then
  export SHADOW_DATABASE_URL="$SHADOW_DATABASE_URL_OVERRIDE"
fi

PRISMA_BIN="$ROOT_DIR/tools/prisma-cli/node_modules/.bin/prisma"

if [ ! -x "$PRISMA_BIN" ]; then
  echo "ERROR: Prisma CLI tooling is not installed."
  echo "Run: npm install --prefix tools/prisma-cli"
  exit 1
fi

exec "$PRISMA_BIN" "$@"
