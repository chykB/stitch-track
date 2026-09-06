#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.." &&
  pwd
)"

cd "$PROJECT_ROOT"

if [[ ! -f .env.local ]]; then
  echo "ERROR: .env.local is required for integration tests." >&2
  exit 1
fi

set -a
source .env.local
set +a

if [[ -z "${TEST_DATABASE_URL:-}" ]]; then
  echo "ERROR: TEST_DATABASE_URL is not configured." >&2
  exit 1
fi

TEST_DATABASE_NAME="$(
  node - <<'NODE'
const value = process.env.TEST_DATABASE_URL;

if (!value) {
  process.exit(1);
}

const url = new URL(value);
process.stdout.write(url.pathname.slice(1));
NODE
)"

if [[ "$TEST_DATABASE_NAME" != *_test ]]; then
  echo "ERROR: refusing integration tests against non-test database: $TEST_DATABASE_NAME" >&2
  exit 1
fi

export DATABASE_URL="$TEST_DATABASE_URL"

echo "Integration database safety check: PASS ($TEST_DATABASE_NAME)"

exec node \
  ./node_modules/vitest/vitest.mjs \
  run \
  --config vitest.integration.config.mts \
  "$@"
