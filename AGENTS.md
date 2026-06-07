# AGENTS.md - fastify-hl7

Guide for AI agents working in this repo. Pair with `CLAUDE.md` (the working agreement and
hook-enforced rules). Keep this file current when the build, layout, or public API changes.

## What this is

A Fastify v5 plugin (built on `fastify-plugin`) that wraps the
[`node-hl7-client`](https://github.com/Bugs5382/node-hl7-client) and
[`node-hl7-server`](https://github.com/Bugs5382/node-hl7-server) libraries so a Fastify app can
send and receive HL7 v2.x messages over MLLP. The plugin decorates the Fastify instance with
factories for HL7 clients, listeners, and message/batch builders; it does not re-document the
underlying libraries (see their repos for transport and builder details).

Published to npm as `fastify-hl7`. Ships dual ESM + CJS with type declarations.

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
