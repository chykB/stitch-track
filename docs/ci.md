# StitchTrack Continuous Integration

This document describes the CI foundation introduced in V0.1-H.

## Purpose

CI automatically reproduces the engineering quality gates that are already
expected to pass locally.

The workflow is intentionally small.

It does not introduce a deployment system, release automation, additional test
frameworks, or new application architecture.

The workflow is defined in:

`.github/workflows/ci.yml`

## Triggers

CI runs on:

- every push,
- pull requests targeting `main`.

This allows feature branches to be checked before integration into the main
branch.

## Runtime

The CI job runs on:

`ubuntu-latest`

The project Node.js version is pinned to:

`24.16.0`

This keeps CI aligned with the current development environment.

## Dependency installation

The repository contains two intentionally separate dependency trees.

### Application dependencies

Installed with:

    npm ci

These use the root:

`package-lock.json`

### Prisma CLI tooling

Installed separately with:

    npm ci --prefix tools/prisma-cli

These use:

`tools/prisma-cli/package-lock.json`

The Prisma CLI tooling remains isolated from the application runtime dependency
tree.

CI caching takes both lockfiles into account.

## PostgreSQL

CI uses a disposable PostgreSQL 16 service container.

The database is created only for the CI job and destroyed with the runner.

The current CI test database is:

`stitchtrack_test`

The CI PostgreSQL credentials are temporary runner-local credentials and are
not production or development secrets.

The workflow does not use the developer's `.env.local`.

Instead, it creates an ephemeral `.env.local` inside the CI runner using the
CI database URLs.

## Prisma

CI performs:

    npm run prisma:generate
    npm run prisma:validate
    npm run db:deploy

This verifies that:

- Prisma Client generation succeeds,
- the Prisma schema is valid,
- committed migrations can be deployed to a clean PostgreSQL database.

Migration creation does not happen in CI.

New migrations must be deliberately created and reviewed during development.

## Quality gate

The workflow currently runs:

    npm run typecheck
    npm run lint
    npm run test
    npm run test:integration
    npm run build
    npm audit

These checks cover:

- TypeScript correctness,
- architecture and lint rules,
- unit tests,
- real PostgreSQL integration tests,
- production compilation,
- root application dependency vulnerabilities.

The isolated Prisma CLI dependency tree is not treated as production runtime
code.

## Integration-test safety

The integration suite still uses its existing test-database safety guard.

`TEST_DATABASE_URL` points to:

`stitchtrack_test`

and is mapped to `DATABASE_URL` only after validation.

Integration tests must not be changed to bypass the `_test` database-name
requirement.

## Security

The workflow uses:

    permissions:
      contents: read

The quality job does not require write permissions.

No application secrets are required for this foundation CI workflow.

Do not add production credentials to this workflow.

Future features that require secrets must use GitHub's secret-management
mechanism and should be introduced only when required by an actual deployment
or integration.

## Scope

V0.1-H CI verifies engineering health.

It does not:

- deploy StitchTrack,
- publish packages,
- create releases,
- modify databases outside the temporary CI runner,
- perform product-domain automation,
- introduce browser testing before browser workflows exist.

Deployment and release automation should be designed separately when the
product reaches the appropriate stage.
