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
