# StitchTrack Testing Strategy

This document defines the testing foundation introduced in V0.1-F.

## Goals

The testing foundation exists to:

- verify domain and application behavior quickly with unit tests,
- verify infrastructure behavior against a real PostgreSQL database,
- prevent integration tests from running against development databases,
- keep test categories separate,
- support repeatable quality gates before commits and releases.

No product-domain behavior is introduced by V0.1-F.

## Test stack

StitchTrack uses:

- Vitest 4.1.11
- @vitest/coverage-v8 4.1.11
- Node.js test environment
- PostgreSQL 16 for database integration tests

The test packages are pinned deliberately.

Browser and UI testing tools are not included yet.

React Testing Library, jsdom, browser-mode testing, and Playwright should be
introduced only when product behavior requires them.

## Test categories

### Unit tests

Unit tests are stored under:

`tests/unit`

They use:

`vitest.config.mts`

Run:

    npm run test

Watch mode:

    npm run test:watch

Coverage:

    npm run test:coverage

Unit tests must not require PostgreSQL.

They are intended primarily for:

- domain rules,
- application use cases,
- value objects,
- validation logic,
- pure business behavior.

### Integration tests

Integration tests are stored under:

`tests/integration`

Integration test files follow:

`*.integration.test.ts`

They use:

`vitest.integration.config.mts`

Run:

    npm run test:integration

Integration tests may use real infrastructure such as PostgreSQL.

They must never use the development database.

## Dedicated test database

Database integration tests use:

`TEST_DATABASE_URL`

The current local integration database is:

`stitchtrack_test`

The integration configuration validates the database URL before any test
runs.

The database name must end with:

`_test`

For example:

`stitchtrack_test`

A development database such as:

`stitchtrack_dev`

is explicitly rejected before the test suite starts.

This safety guard exists in:

`tests/support/test-database.mts`

## Database runtime used in integration tests

Integration tests use the same database infrastructure as the application:

Prisma Client -> @prisma/adapter-pg -> pg -> PostgreSQL

Tests must not replace this path with a fake database when the purpose of the
test is to verify persistence behavior.

## Database test parallelism

Database integration tests currently run with:

- one worker,
- file parallelism disabled.

This is intentional during the engineering-foundation stage.

Parallel database testing may be introduced later only after database
isolation and cleanup strategies are explicitly designed.

## Test environment isolation

Integration configuration maps the validated test URL to:

`DATABASE_URL`

This allows the normal Prisma runtime module to operate without introducing a
second application database implementation just for tests.

The test runner must validate `TEST_DATABASE_URL` before this mapping occurs.

## Coverage

Coverage uses the V8 provider.

Run:

    npm run test:coverage

Coverage output is written to:

`coverage`

The directory is ignored by Git.

Generated Prisma code is excluded from coverage calculations.

Coverage percentage alone is not considered proof of correctness.

Tests should focus on meaningful behavior and important failure paths.

## Combined test gate

Run both unit and integration tests with:

    npm run test:all

The current pre-commit engineering gate is:

    npm run test:all
    npm run typecheck
    npm run lint
    npm run build

Database migrations and Prisma validation should also be checked when schema
or persistence infrastructure changes.

## Architectural testing principles

Domain tests should not depend on:

- Next.js,
- React,
- Prisma,
- PostgreSQL,
- HTTP,
- presentation code.

Application tests may depend on Domain code and application ports but should
not depend directly on concrete Prisma infrastructure.

Infrastructure integration tests may use real Prisma and PostgreSQL.

Presentation and browser tests will be introduced separately when the product
contains meaningful user-facing workflows.

## Safety rule

Never weaken or bypass the test-database safety guard merely to make an
integration test pass.

If an integration test attempts to run against a database whose name does not
end in `_test`, the correct behavior is to stop before executing the suite.

## Integration database process isolation

Integration tests run through:

`scripts/run-integration-tests.sh`

The runner loads `.env.local`, verifies that `TEST_DATABASE_URL` identifies a
database whose name ends in `_test`, and then exports:

`DATABASE_URL="$TEST_DATABASE_URL"`

before Vitest starts.

This is important for integration tests that import production database or
authentication modules because those modules resolve `DATABASE_URL` during
process initialization.

Integration tests must not be invoked directly with Vitest when they exercise
the real Prisma client or Better Auth runtime.

The test runner refuses to start when the configured test database does not
have a `_test` database name.

In CI, authentication tests use `http://localhost:3000` as the Better Auth
base URL and a fresh high-entropy `BETTER_AUTH_SECRET` generated for each CI
run.

The generated CI secret is test-only and ephemeral. Production authentication
secrets must not be stored in the repository or hardcoded into the workflow.
