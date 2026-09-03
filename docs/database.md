# StitchTrack Database Development Setup

## Purpose

StitchTrack uses PostgreSQL as its authoritative relational database.

The local development environment deliberately separates development data from integration-test data.

Current local PostgreSQL server:

- PostgreSQL 16
- Host: 127.0.0.1
- Port: 5432

The application must not connect using the PostgreSQL superuser.

---

## Local Databases

### Development

Database:

stitchtrack_dev

Application role:

stitchtrack_dev_app

Purpose:

Used by the local development application.

---

### Integration Testing

Database:

stitchtrack_test

Application role:

stitchtrack_test_app

Purpose:

Used only by automated database integration tests.

Tests must never use the development database.

---

## Role Restrictions

Both application roles are intentionally restricted.

They are not:

- superusers
- database creators
- role creators
- replication roles
- BYPASSRLS roles

This follows the principle of least privilege.

---

## Database Isolation

The development role can connect to:

stitchtrack_dev

but not:

stitchtrack_test

The test role can connect to:

stitchtrack_test

but not:

stitchtrack_dev

This protects development records from destructive integration-test operations.

---

## Environment Variables

Local credentials live in:

.env.local

This file must never be committed.

Required variables:

DATABASE_URL

TEST_DATABASE_URL

A safe template is committed as:

.env.example

Do not place real passwords inside .env.example.

---

## Loading Local Environment Variables

For direct shell database commands:

set -a
source .env.local
set +a

Do not print DATABASE_URL or TEST_DATABASE_URL because both contain passwords.

---

## Development Connection Check

After loading the environment:

psql "$DATABASE_URL" -c "
SELECT
  current_database(),
  current_user;
"

Expected database:

stitchtrack_dev

Expected user:

stitchtrack_dev_app

---

## Test Connection Check

Run:

psql "$TEST_DATABASE_URL" -c "
SELECT
  current_database(),
  current_user;
"

Expected database:

stitchtrack_test

Expected user:

stitchtrack_test_app

---

## PostgreSQL Service

Check cluster state with:

pg_lsclusters

The expected local development cluster is:

PostgreSQL 16
cluster main
port 5432
status online

Check connectivity with:

pg_isready

---

## Important Rules

1. Do not use the postgres superuser from application code.

2. Do not run integration tests against stitchtrack_dev.

3. Do not commit .env.local.

4. Do not put database passwords in source code.

5. Do not manually create production tables.

6. Once Prisma is introduced, schema changes must use migrations.

7. Development and test databases must remain independent.

8. Database infrastructure must remain outside the domain layer.

---

## Architecture Boundary

PostgreSQL is an infrastructure concern.

Future dependency direction:

Presentation
    ↓
Application
    ↓
Domain

Infrastructure
    ↓
PostgreSQL

Application code will communicate with persistence through interfaces rather than directly through PostgreSQL or Prisma.

---

## Current Scope

This database foundation does not yet contain StitchTrack product tables.

The following are deliberately deferred:

- businesses
- users
- clients
- orders
- garments
- measurements
- approvals
- changes
- fittings
- payments
- delivery history

Those will be introduced in their appropriate versioned phases.

## Prisma persistence foundation

StitchTrack uses Prisma as its PostgreSQL persistence adapter.

### Versions

The V0.1 engineering foundation uses:

- PostgreSQL server 16
- Prisma Client 6.19.3
- Prisma PostgreSQL adapter 6.19.3
- pg 8.23.0
- Prisma CLI 6.19.3

The Prisma packages are pinned deliberately rather than automatically
following major releases.

### Runtime dependency boundary

The root StitchTrack application contains only the Prisma packages required
to execute application database operations:

- `@prisma/client`
- `@prisma/adapter-pg`
- `pg`

The Prisma CLI is not installed in the root application dependency tree.

Migration and client-generation tooling is isolated under:

`tools/prisma-cli`

This prevents Prisma CLI-only dependencies from becoming part of the
application runtime dependency tree.

The tooling package must not be converted into an npm workspace or imported
by application source code.

### Generated client

The Prisma Client uses the `prisma-client` generator and is generated into:

`src/generated/prisma`

Generated Prisma code is ignored by Git.

After cloning the repository:

    npm install
    npm run prisma:install
    npm run prisma:generate

### Environment variables

Local database credentials are stored in the ignored `.env.local` file.

The persistence tooling expects:

- `DATABASE_URL`
- `TEST_DATABASE_URL`
- `SHADOW_DATABASE_URL`

`.env.example` contains placeholders only and must never contain real
credentials.

### Development databases

The local development environment uses three databases:

- `stitchtrack_dev` — application development database
- `stitchtrack_test` — integration-test database
- `stitchtrack_shadow` — Prisma migration shadow database

The test role cannot access the development or shadow databases.

The development role cannot access the test database.

### Migration policy

Database structure is changed only through committed Prisma migrations.

Development migrations use:

    npm run db:migrate

Migration state can be inspected with:

    npm run db:migrate:status

Committed migrations are deployed to non-development environments with:

    npm run db:deploy

Development, test, and future production environments must use the same
committed migration history.

Manual recreation of application schemas is not an accepted deployment
workflow.

### Foundation migration

V0.1-E introduced:

`20260903220732_foundation`

The migration is intentionally empty because V0.1 establishes persistence
infrastructure only and does not introduce product-domain tables.

Both `stitchtrack_dev` and `stitchtrack_test` have this migration applied.

At this checkpoint, the only persistent Prisma table is:

`_prisma_migrations`

Product-domain tables are introduced in later versions.

### Application architecture

Prisma is infrastructure.

Domain and application layers must not import Prisma Client, generated Prisma
code, database adapters, or shared database infrastructure.

Presentation code must not call Prisma directly.

Infrastructure implementations may use Prisma when implementing repository
ports defined by the application layer.

These boundaries are enforced through ESLint import restrictions.

### Runtime verification

`scripts/verify-database.ts` verifies the runtime connection path:

Prisma Client -> @prisma/adapter-pg -> pg -> PostgreSQL

The verification checks the expected database name and database role without
printing credentials.

Development verification:

    npm run db:verify

Test verification:

    DATABASE_URL="$TEST_DATABASE_URL" npm run db:verify

### Security note

The Prisma CLI is kept outside the runtime package because the selected CLI
version currently contains development-tooling dependencies that should not
ship with the application runtime.

Do not use `npm audit fix --force` to rewrite Prisma's dependency graph.

Dependency security must be reassessed when Prisma is upgraded.
