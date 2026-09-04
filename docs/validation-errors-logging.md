# StitchTrack Validation, Errors, and Logging

This document defines the validation, error-handling, and logging foundation
introduced in V0.1-G.

## Goals

The foundation exists to:

- validate untrusted data at system boundaries,
- prevent validation libraries from becoming domain dependencies,
- represent expected application failures with stable semantic error codes,
- return safe presentation-layer error responses,
- log unexpected failures without exposing internal details to clients,
- provide structured server-side logging,
- redact common sensitive values,
- preserve separation of concerns between application and infrastructure.

No StitchTrack product-domain behavior is introduced in V0.1-G.

## Validation

StitchTrack uses Zod at input and output boundaries.

The current validation helper is:

`src/shared/validation/parse-input.ts`

Invalid boundary input is converted into:

`InputValidationError`

defined in:

`src/shared/validation/input-validation-error.ts`

### Validation boundary rule

Zod is a boundary implementation detail.

Domain and application code must not depend directly on Zod.

The intended flow is:

    untrusted input
        |
        v
    boundary schema
        |
        v
    Zod validation
        |
        v
    validated data
        |
        v
    application use case

Domain rules remain responsible for domain invariants even after boundary
validation succeeds.

Validation is not a replacement for business rules.

## Validation errors

`InputValidationError` contains structured issues with:

- path
- code
- message

The raw submitted object is not stored on the error.

This reduces the risk of accidentally retaining or logging sensitive input.

## Application errors

Expected use-case failures use:

`ApplicationError`

defined in:

`src/shared/application/errors/application-error.ts`

Current semantic codes are:

- `NOT_FOUND`
- `CONFLICT`
- `UNAUTHORIZED`
- `FORBIDDEN`

Application errors describe application semantics.

They do not contain HTTP concepts.

Application code must not depend on:

- HTTP status codes,
- NextResponse,
- React,
- Next.js presentation APIs.

The presentation layer decides how application error codes are represented to
external callers.

## Safe presentation errors

Presentation-safe error conversion is implemented in:

`src/shared/presentation/errors/to-safe-error-response.ts`

Current mappings are:

- `INVALID_INPUT` -> 400
- `UNAUTHORIZED` -> 401
- `FORBIDDEN` -> 403
- `NOT_FOUND` -> 404
- `CONFLICT` -> 409
- unexpected failures -> 500

Application error messages are not automatically exposed to clients.

Presentation responses are generated from stable error codes and safe public
messages.

Unexpected errors return:

`INTERNAL_ERROR`

with a generic message.

Internal stack traces, database details, credentials, and arbitrary thrown
values must not be returned to external callers.

## Logging abstraction

Application code depends on:

`ApplicationLogger`

defined in:

`src/shared/application/logging/logger.ts`

The application logging interface currently exposes:

- `debug`
- `info`
- `warn`
- `error`

The application layer does not depend directly on Pino.

This allows application behavior to remain independent of the concrete logging
technology.

## Pino implementation

The current structured logging implementation is:

`src/shared/infrastructure/logging/pino-logger.ts`

Pino belongs to infrastructure.

Application and presentation code must not import Pino directly.

Structured application data is nested beneath:

`context`

instead of merging arbitrary objects into the root log object.

## Sensitive-data redaction

The Pino logger redacts common sensitive fields including:

- passwords
- tokens
- access tokens
- refresh tokens
- authorization values
- cookies
- API keys
- secrets
- credential fields

Sensitive HTTP header values such as authorization and cookies are also
redacted when logged beneath the supported context structure.

Redaction paths are fixed in application code.

Do not create logger redaction paths dynamically from user-controlled input.

## Error logging

Unexpected errors are logged internally before a generic external error
response is returned.

For actual Error instances, logging captures only controlled fields:

- name
- message
- stack

Arbitrary enumerable properties attached to Error objects are not copied into
the structured error payload.

Arbitrary non-Error thrown values are not serialized directly.

## Architectural boundaries

The following dependencies are enforced by ESLint.

### Domain

Domain code must not depend on:

- Next.js
- React
- Prisma
- Zod
- Pino
- application services
- infrastructure
- presentation code
- database infrastructure

### Application

Application code may depend on:

- domain code
- application ports
- `ApplicationLogger`
- `ApplicationError`

Application code must not depend on:

- Next.js
- React
- Prisma
- Zod
- Pino
- concrete infrastructure
- presentation code
- boundary validation implementations

### Presentation

Presentation code may:

- validate untrusted input,
- call application use cases,
- convert application failures into safe external responses,
- depend on the application logging abstraction when necessary.

Presentation code must not:

- call Prisma directly,
- import Pino directly,
- access infrastructure implementations directly.

### Infrastructure

Infrastructure may implement application ports using concrete technologies such
as:

- Prisma,
- PostgreSQL,
- Pino.

Infrastructure must not depend on presentation concerns such as React or
Next.js UI code.

## Testing

V0.1-G includes unit tests covering:

- valid and invalid boundary input,
- structured validation issues,
- raw-input retention protection,
- application error classification,
- safe public error mapping,
- unexpected error handling,
- structured logging,
- log-level filtering,
- credential and header redaction,
- Error object sanitization,
- arbitrary thrown-value sanitization.

Architectural restrictions were also verified with temporary invalid imports.
Each prohibited import correctly caused ESLint to fail before the temporary
files were removed.

## Security principles

Never:

- log raw request bodies by default,
- expose stack traces to clients,
- expose database errors directly to clients,
- expose internal application-error messages automatically,
- log passwords, tokens, cookies, or authorization headers,
- bypass redaction to simplify debugging,
- import Pino directly into application or presentation code,
- import Zod into domain or application code.

Logging should provide enough context for investigation without becoming a
secondary store of sensitive business or personal information.
