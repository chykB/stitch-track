# StitchTrack Prisma CLI Tooling

This directory contains the Prisma CLI used for schema validation,
client generation, and database migrations.

It is intentionally isolated from the root StitchTrack application
dependency tree.

## Why it is isolated

Prisma CLI 6.19.3 currently depends on development tooling that includes
a vulnerable version of deepmerge-ts.

The StitchTrack runtime does not require the Prisma CLI. The application
runtime requires only:

- @prisma/client
- @prisma/adapter-pg
- pg

Keeping the CLI in this separate package prevents Prisma migration tooling
from being installed as part of the application runtime dependency tree.

## Rules

1. Do not add this directory as an npm workspace.
2. Do not add `prisma` to the root package.json.
3. Do not import packages from this directory into application source code.
4. Do not deploy this package as part of the application runtime.
5. Reassess this isolation when upgrading Prisma.
6. Keep Prisma CLI and Prisma Client on compatible versions.

## Installation

From the repository root:

    npm run prisma:install

## Generate the client

    npm run prisma:generate

## Validate the schema

    npm run prisma:validate

## Database migrations

Development:

    npm run db:migrate

Migration status:

    npm run db:migrate:status

Deployment:

    npm run db:deploy

Database credentials must remain in ignored environment files such as
`.env.local`. Never commit database passwords or connection URLs.
