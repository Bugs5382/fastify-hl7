# AGENTS.md - fastify-hl7

Guide for AI agents working in this repo. Pair with `CLAUDE.md` (the working agreement and
hook-enforced rules). Keep this file current when the build, layout, or public API changes.

## What this is

A Fastify v5 plugin (built on `fastify-plugin`) that wraps the `node-hl7-client` and
`node-hl7-server` packages — both shipped from the
[`node-hl7`](https://github.com/Bugs5382/node-hl7) repo — so a Fastify app can
send and receive HL7 v2.x messages over MLLP. The plugin decorates the Fastify instance with
factories for HL7 clients, listeners, and message/batch builders; it does not re-document the
underlying libraries (see their repos for transport and builder details).

Published to npm as `fastify-hl7`. Ships dual ESM + CJS with type declarations.

## Using fastify-hl7 in an app

If you are an agent wiring this plugin into a Fastify app (not editing this repo), start from the
[README](./README.md) — it has the full `fastify.hl7` API reference and runnable recipes (round-trip,
routing, multiple clients, builders, ACK/NAK, parsing, shutdown, TLS, lookups, error handling). The
contract to respect:

- **Single entry point.** Register the plugin (`await app.register(fastifyHL7, opts)`) and use the
  `app.hl7` decorator for everything. Do not import `node-hl7-client` / `node-hl7-server` directly in
  app code.
- **Names.** A client name and an inbound-listener name must be unique and free of spaces and the
  special characters listed in the README. An outbound `createConnection(name, ...)` references an
  existing **client** name.
- **Explicit HL7 version.** The underlying libraries require an explicit HL7 version per client and
  per listener (no default). Thread it through the connection/listener options from the underlying
  library; never assume a fallback.
- **Validated builds.** Prefer `app.hl7.createBuilder(version)` for a version-validated message
  builder (chain `build*`, finish with `.toMessage()`); `buildMessage` is the lightweight,
  unvalidated path.
- **Acknowledge inbound messages** with `res.sendResponse("AA" | "AE" | "AR")`.
- **Shutdown is automatic.** The plugin closes all clients and listeners on Fastify `preClose`; call
  `closeServer(port)` / `closeServerAll()` only to close early.
- **`enableServer: false`** turns off the server; server-side methods then throw
  `FASTIFY_HL7_ERR_USAGE`.

## Layout

- `src/index.ts` - plugin entry; registered through `fastify-plugin`, wires up the decorator.
- `src/decorate.ts` - decorates the Fastify instance with the HL7 client/server/build API.
- `src/api.ts` - the public API surface the decorator exposes.
- `src/class/hL7Client.ts` - wraps `node-hl7-client` (`Client`, `Message`, `Batch`, `FileBatch`).
- `src/class/hL7Server.ts` - wraps `node-hl7-server` (`Server`, `Inbound`).
- `src/types.ts` - plugin option and public type definitions.
- `src/validation.ts` - plugin option validation.
- `src/errors.ts` - `@fastify/error` definitions.
- `__tests__/` - vitest suite, including an end-to-end client/server round-trip.

## Build, test, lint

- Build: `npm run build` (emits to `lib/` as ESM + CJS + types).
- Test: `npm test` (vitest, single run) or `npm run test:watch`.
- Lint: `npm run lint` (eslint + npm-package-json-lint); `npm run lint:fix` to autofix.
- Docs: `npm run typedoc`.

## Conventions and gotchas

- The underlying `node-hl7` libraries require an explicit HL7 version per client and per listener
  (there is no default). Always thread an explicit version through the plugin API; never
  reintroduce a hardcoded version fallback.
- The plugin is the only public entry point. Construct HL7 objects through the decorated API, not
  by importing the underlying libraries directly in app code.
- See `CLAUDE.md` for branch/commit/PR rules; these are enforced by the git hooks in `.claude/hooks`.
