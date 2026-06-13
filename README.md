# 🏥 Fastify HL7

A Fastify HL7 plugin developed in pure TypeScript.
It wraps the `node-hl7-client` and `node-hl7-server` packages — both shipped from the
[`node-hl7`](https://github.com/Bugs5382/node-hl7) repo — so a Fastify app can send and
receive HL7 v2.x messages over MLLP.

The build exports valid ESM and CJS for cross-compatibility.

If you use this package, please consider giving it a ⭐ — it raises visibility and brings in more
contribution from the outside.

> This documentation covers **how to use the plugin**. It does not re-document the underlying
> libraries (segment-by-segment message building, transport internals). For those, see
> [External Libraries](#-external-libraries).

> 🟢 **Requires Node.js ≥ 22** (inherited from the underlying `node-hl7` packages).

> ⚠️ **HL7 version is required.** Every client and every inbound listener must pin an explicit
> `version` — one of `"2.1" | "2.2" | "2.3" | "2.3.1" | "2.4" | "2.5" | "2.5.1" | "2.6" | "2.7" |
> "2.7.1" | "2.8"`. There is no default. A client's `version` must match the `MSH.12` of every
> message it sends; an inbound listener rejects (`AR`) any message whose `MSH.12` differs.

## Table of Contents

1. [Install](#-install)
2. [Basic Usage](#-basic-usage)
   1. [Register the plugin](#register-the-plugin)
   2. [Server quick start](#server-quick-start)
   3. [Client quick start](#client-quick-start)
3. [Recipes](#-recipes)
   1. [Full round-trip in one app](#1-full-round-trip-in-one-app)
   2. [Route multiple inbound listeners](#2-route-multiple-inbound-listeners)
   3. [Multiple clients and outbound connections](#3-multiple-clients-and-outbound-connections)
   4. [Build messages, batches, and file batches](#4-build-messages-batches-and-file-batches)
   5. [Parse inbound HL7 and read files](#5-parse-inbound-hl7-and-read-files)
   6. [ACK / NAK responses](#6-ack--nak-responses)
   7. [Graceful shutdown](#7-graceful-shutdown)
   8. [TLS and server options](#8-tls-and-server-options)
   9. [Look up live clients and listeners](#9-look-up-live-clients-and-listeners)
   10. [Error handling when the server is disabled](#10-error-handling-when-the-server-is-disabled)
   11. [Encapsulate sending in your own plugin](#11-encapsulate-sending-in-your-own-plugin)
4. [API Reference](#-api-reference-fastifyhl7)
5. [Plugin Options](#-plugin-options)
6. [External Libraries](#-external-libraries)
7. [Acknowledgements](#-acknowledgements)
8. [License](#-license)

## 📦 Install

```shell
npm install fastify-hl7
```

Requires Node.js ≥ 22.

## 🚀 Basic Usage

### Register the plugin

```ts
import fastify from "fastify";
import fastifyHL7 from "fastify-hl7";

const app = fastify();

await app.register(fastifyHL7);
```

Registering decorates the Fastify instance with `app.hl7` — the single entry point for HL7
clients, inbound listeners, and message builders. By default the inbound **server** is enabled;
pass `{ enableServer: false }` for a client-only app (see [Plugin Options](#-plugin-options)).

### Server quick start

Create an inbound listener. It must pin an HL7 `version`. The handler receives each inbound message
and replies with an acknowledgement code (`"AA"` accept, `"AE"` error, `"AR"` reject):

```ts
const listener = app.hl7.createInbound(
  "ib_adt",
  { port: 3001, version: "2.7" },
  async (req, res) => {
    const message = req.getMessage();
    const type = req.getType();
    app.log.info("received %s", type);
    // ...your logic here...
    await res.sendResponse("AA");
  },
);
```

`createInbound` returns the listener so you can attach advanced event handlers if needed. Any inbound
message whose `MSH.12` is not `"2.7"` is rejected with an `AR` before your handler runs.

### Client quick start

A **client** is a named handle to one remote host and pins the HL7 `version` for everything it
sends. Outbound **connections** are attached to that client by its name — so the first argument to
`createConnection` is the **client name**, not a new identifier (it inherits the client's version):

```ts
// 1. Register a named client pointed at a remote host, pinned to an HL7 version.
app.hl7.createClient("adt_host", { host: "127.0.0.1", version: "2.7" });

// 2. Attach an outbound connection to that client (note: "adt_host" matches above).
const connection = app.hl7.createConnection(
  "adt_host",
  { port: 3001 },
  async (res) => {
    const reply = res.getMessage();
    // Handle the ACK/NAK the remote returned, e.g. res.getMessage().get("MSA.1").
  },
);

// 3. Build a message (its MSH.12 must match the client version) and send it.
const message = app.hl7.buildMessage({
  messageHeader: {
    msh_9_1: "ADT",
    msh_9_2: "A01",
    msh_10: "MSG00001",
    msh_11_1: "P",
    msh_12: "2.7",
  },
});

await connection.sendMessage(message);
```

The client name is a unique identifier for a host, so you can attach several outbound connections
(different ports) to the same host, and create several clients for different hosts.

> ⚠️ A client name must be unique and may not contain spaces or the characters
> `` `!@#$%^&*()+-=[]{};':"\|,.<>/?~ ``. The same rule applies to inbound listener names.

## 🧩 Recipes

### 1. Full round-trip in one app

A single Fastify app that listens for inbound HL7 **and** sends outbound HL7 to itself — useful for
local testing or a relay. Keep the versions aligned across the listener, the client, and the
message:

```ts
import fastify from "fastify";
import fastifyHL7 from "fastify-hl7";

const app = fastify();
await app.register(fastifyHL7);

// Inbound: accept everything, echo back an "AA".
app.hl7.createInbound("ib_adt", { port: 3001, version: "2.7" }, async (req, res) => {
  app.log.info("inbound %s", req.getType());
  await res.sendResponse("AA");
});

// Outbound: a client pointed at our own listener, same version.
app.hl7.createClient("self", { host: "127.0.0.1", version: "2.7" });
const out = app.hl7.createConnection("self", { port: 3001 }, async (res) => {
  app.log.info("ack: %s", res.getMessage().get("MSA.1").toString());
});

await app.listen({ port: 3000 });

const message = app.hl7.buildMessage({
  messageHeader: { msh_9_1: "ADT", msh_9_2: "A01", msh_11_1: "P", msh_12: "2.7" },
});
await out.sendMessage(message);
```

### 2. Route multiple inbound listeners

One server hosts many inbound listeners on different ports — for example, one per feed. Each pins
its own version:

```ts
app.hl7.createInbound("adt_feed", { port: 3001, version: "2.7" }, async (req, res) => {
  // ADT (admit/discharge/transfer) feed.
  await res.sendResponse("AA");
});

app.hl7.createInbound("oru_feed", { port: 3002, version: "2.7" }, async (req, res) => {
  // ORU (observation result) feed; branch on the message type.
  if (req.getType() === "ORU") {
    // ...persist the result...
    await res.sendResponse("AA");
  } else {
    await res.sendResponse("AR"); // reject anything unexpected on this port
  }
});
```

> There is only **one** server per host (the machine this runs on), but it can host any number of
> inbound listeners on distinct ports.

### 3. Multiple clients and outbound connections

An interface engine often talks to several downstream systems. Create one client per host (each with
its version), and one connection per port on that host:

```ts
app.hl7.createClient("lab", { host: "10.0.0.10", version: "2.5.1" });
app.hl7.createClient("pharmacy", { host: "10.0.0.20", version: "2.7" });

const labOrders = app.hl7.createConnection("lab", { port: 6661 }, async () => {});
const labResults = app.hl7.createConnection("lab", { port: 6662 }, async () => {});
const rxOrders = app.hl7.createConnection("pharmacy", { port: 6661 }, async () => {});

await labOrders.sendMessage(
  app.hl7.buildMessage({
    messageHeader: { msh_9_1: "ORM", msh_9_2: "O01", msh_11_1: "P", msh_12: "2.5.1" },
  }),
);
```

Reusing the same port on the same client throws — pick a distinct outbound port per connection.

### 4. Build messages, batches, and file batches

For a **validated** message, use `createBuilder(version)`. It returns node-hl7-client's
version-pinned builder, which validates every field against that HL7 version (withdrawn fields throw,
backward-compatibility fields warn, segments not in the version are rejected) and sets `MSH.12` to
the version for you. Chain `build*` calls and finish with `toMessage()`:

```ts
const message = app.hl7
  .createBuilder("2.7")
  .buildMSH({
    msh_3: "MY_APP",
    msh_4: "MY_FAC",
    msh_5: "EPIC",
    msh_6: "HOSP",
    msh_9_1: "ADT",
    msh_9_2: "A01",
    msh_10: "MSG00001",
    msh_11_1: "P",
  })
  .buildPID({ pid_3: "MRN12345", pid_5: "DOE^JANE^A", pid_8: "F" })
  .toMessage();
```

Because the builder pins the version, its `MSH.12` always matches a client created with the same
`version`. For a lightweight, **unvalidated** message, `buildMessage` constructs one directly (set
`messageHeader.msh_12` yourself):

```ts
const quick = app.hl7.buildMessage({
  messageHeader: { msh_9_1: "ADT", msh_9_2: "A01", msh_11_1: "P", msh_12: "2.7" },
});

// A batch (BHS) that groups several messages.
const batch = app.hl7.buildBatch();
batch.start();
batch.add(message);
batch.end();

// A file batch (FHS) for writing HL7 to disk.
const fileBatch = app.hl7.buildFileBatch();

// An HL7-formatted timestamp (length 8, 12, or 14 — 14 is the default).
const stamp = app.hl7.buildDate(new Date(), 14);
```

> `buildFileBatch` is for *creating* a file batch — to read an existing one, use `readFile` /
> `readFileBuffer` ([recipe 5](#5-parse-inbound-hl7-and-read-files)).

### 5. Parse inbound HL7 and read files

```ts
// Parse a raw string — returns a Batch if it starts with BHS, otherwise a Message.
const parsed = app.hl7.processHL7(rawHl7String);

// Read a file batch from disk.
const fromPath = app.hl7.readFile("temp/hl7.readTestBHS.20231208.hl7");

// Or from a Buffer you already have in memory.
import { readFileSync } from "node:fs";
const fromBuffer = app.hl7.readFileBuffer(readFileSync("temp/hl7.readTestBHS.20231208.hl7"));
```

### 6. ACK / NAK responses

Inside an inbound handler, reply with the acknowledgement code that fits the outcome:

```ts
app.hl7.createInbound("ib_adt", { port: 3001, version: "2.7" }, async (req, res) => {
  try {
    const message = req.getMessage();
    // ...process the message...
    await res.sendResponse("AA"); // Application Accept
  } catch (err) {
    req.log?.error(err);
    await res.sendResponse("AE"); // Application Error
  }
});
```

Use `"AR"` (Application Reject) for messages you will not process at all (wrong type, unsupported
trigger, etc.). For verbatim, vendor-shaped acknowledgements, `node-hl7-server` exposes
`sendCustomResponse`.

### 7. Graceful shutdown

You do **not** need to close clients or listeners by hand. The plugin registers Fastify `preClose`
hooks that close every outbound connection and inbound listener when the app shuts down:

```ts
const app = fastify();
await app.register(fastifyHL7);
// ...create clients and listeners...

// On app.close() / SIGINT, all HL7 connections close automatically.
await app.close();
```

To close a single listener early, use `app.hl7.closeServer(port)`; to close them all,
`app.hl7.closeServerAll()`.

### 8. TLS and server options

Server options pass straight through to `node-hl7-server` and can only be set at registration time
(you cannot change them after the server is created):

```ts
import { readFileSync } from "node:fs";

await app.register(fastifyHL7, {
  serverOptions: {
    // e.g. bindAddress, IPv6, or TLS — see node-hl7-server's ServerOptions.
    bindAddress: "0.0.0.0",
    tls: {
      key: readFileSync("server.key"),
      cert: readFileSync("server.crt"),
    },
  },
});
```

Client-side TLS is set per client via the `tls` option on `createClient`
(`{ host, version, tls: true | ConnectionOptions }`).

### 9. Look up live clients and listeners

Retrieve handles you created earlier, by name or by port:

```ts
const labClient = app.hl7.getClientByName("lab");           // Client | undefined
const conn = app.hl7.getClientConnectionByPort("6661");     // Connection | undefined

const adtListener = app.hl7.getServerByName("adt_feed");    // Inbound | undefined
const onPort = app.hl7.getServerByPort("3001");             // Inbound | undefined
```

### 10. Error handling when the server is disabled

If you register with `{ enableServer: false }`, every server-side method throws a usage error.
Guard accordingly:

```ts
await app.register(fastifyHL7, { enableServer: false });

try {
  app.hl7.createInbound("ib", { port: 3001, version: "2.7" }, async () => {});
} catch (err) {
  // FASTIFY_HL7_ERR_USAGE: "server was not started.
  // re-register plugin with enableServer set to true."
  app.log.error(err);
}
```

Registering the plugin twice also throws (`FASTIFY_HL7_ERR_SETUP_ERRORS: "Already registered."`).

### 11. Encapsulate sending in your own plugin

This is the pattern the plugin is built for, and the reason it is a plugin at all. Fastify's
encapsulation lets you keep every HL7 concern — registering `fastify-hl7`, the version pin, the
client, the outbound connection, and the ACK handling — in **one plugin**, and expose just a small,
intent-named surface (a decorator like `app.adt`) to the rest of the app. Routes then send a message
in one call; they never touch clients, connections, or message headers.

Wrap your plugin with [`fastify-plugin`](https://github.com/fastify/fastify-plugin) so the decorator
is visible to sibling plugins and routes. Without `fp`, the decorator would be trapped inside this
plugin's own encapsulation context and the rest of the app could not see it.

The helper below builds a **validated** `ADT^A01` with `createBuilder("2.7")`, sends it over a
connection created once at startup, and resolves with the remote's acknowledgement code (`MSA.1`):

```ts
// plugins/adt.ts
import fp from "fastify-plugin";
import fastifyHL7 from "fastify-hl7";

// The HL7 version is pinned in one place. The client, the connection, and the
// builder all use it, so MSH.12 can never drift out of sync.
const HL7_VERSION = "2.7" as const;

// A small, route-facing input — the business shape, not an HL7 message.
interface Patient {
  mrn: string;
  name: string; // HL7 XPN, e.g. "DOE^JANE^A"
  sex?: string; // HL7 administrative sex, e.g. "F"
}

declare module "fastify" {
  interface FastifyInstance {
    adt: {
      /** Send an ADT^A01 (patient admit) and resolve with the ACK code from MSA.1. */
      sendA01: (patient: Patient) => Promise<string>;
    };
  }
}

export default fp(
  async (app) => {
    // 1. Register fastify-hl7. This app only sends, so the inbound server is off.
    await app.register(fastifyHL7, { enableServer: false });

    // 2. Wire the client and one outbound connection once, at startup. The ACK
    //    handler resolves a pending promise so the helper can await the reply.
    const host = process.env.ADT_HOST ?? "127.0.0.1";
    const port = Number(process.env.ADT_PORT ?? 3001);

    app.hl7.createClient("adt_host", { host, version: HL7_VERSION });

    let resolveAck: ((code: string) => void) | undefined;
    const connection = app.hl7.createConnection(
      "adt_host",
      { port, version: HL7_VERSION },
      async (res) => {
        // The remote replies with an ACK/NAK message; MSA.1 carries the code.
        const code = res.getMessage().get("MSA.1").toString();
        resolveAck?.(code);
      },
    );

    // 3. Expose one intent-named helper. Routes call app.adt.sendA01(patient)
    //    and stay ignorant of HL7 framing, the connection, and the version.
    app.decorate("adt", {
      sendA01: async (patient: Patient): Promise<string> => {
        const message = app.hl7
          .createBuilder(HL7_VERSION)
          .buildMSH({
            msh_3: "MY_APP",
            msh_4: "MY_FAC",
            msh_5: "EPIC",
            msh_6: "HOSP",
            msh_9_1: "ADT",
            msh_9_2: "A01",
            msh_10: app.hl7.buildDate(new Date()),
            msh_11_1: "P",
          })
          .buildEVN({ evn_1: "A01", evn_2: new Date() })
          .buildPID({ pid_3: patient.mrn, pid_5: patient.name, pid_8: patient.sex })
          .buildPV1({ pv1_2: "I" }) // patient class: I = inpatient
          .toMessage();

        const ack = new Promise<string>((resolve) => {
          resolveAck = resolve;
        });
        await connection.sendMessage(message);
        return ack;
      },
    });

    // 4. No teardown to write: fastify-hl7 registers preClose hooks that close
    //    the client and connection automatically when the app shuts down.
  },
  { name: "adt" },
);
```

> The ACK handler above resolves a single pending promise, which keeps the example focused on the
> encapsulation pattern. The handler is per-connection and is not correlated to a specific outgoing
> message, so if you send several messages concurrently over the same connection you should match each
> reply to its request yourself — e.g. key pending promises by the `MSH.10` message-control id you set
> on the outgoing message and read back from the ACK's `MSA.2`.

Register it once, then admit a patient from anywhere with a single call:

```ts
import fastify from "fastify";
import adt from "./plugins/adt";

const app = fastify();
await app.register(adt);

app.post("/admit", async (request) => {
  const ackCode = await app.adt.sendA01(request.body as never);
  return { accepted: ackCode === "AA", ackCode };
});

await app.listen({ port: 3000 });
```

Why this shape works well:

- **One place owns HL7.** Registration, version pin, client, connection, and message building live
  together; the rest of the app depends only on `app.adt`.
- **Startup wires, routes send.** The client and connection are created once at boot, so the first
  request does not rebuild the connection or re-pin the version.
- **The version cannot drift.** `HL7_VERSION` feeds `createClient` and `createBuilder`, and the
  builder stamps it into `MSH.12` — so the message a client sends always matches the version that
  client was created with.
- **Lifecycle is handled for you.** `fastify-hl7`'s `preClose` hooks close the client and connection
  with the app (see [Graceful shutdown](#7-graceful-shutdown)) — important for clean restarts and for
  tests that start and stop Fastify repeatedly.
- **Swappable.** Because routes only know `app.adt`, you can repoint the host, add a second trigger
  (`sendA08`, an `ORU` result via [recipe 4](#4-build-messages-batches-and-file-batches)), or stub the
  decorator in a test without touching route code.

> **Registration order:** register your wrapper plugin (which registers `fastify-hl7` internally)
> before any plugin or route that uses `app.adt`. Because the wrapper is an `fp` plugin, Fastify
> guarantees its decorators are in place before sibling plugins and routes load.
>
> The types you need — `HL7`, `FastifyHL7Options`, and the client/server option types — are described
> in the [API Reference](#-api-reference-fastifyhl7); the underlying message, segment, and builder
> types come from `node-hl7-client` (see [External Libraries](#-external-libraries)).

## 📖 API Reference (`fastify.hl7`)

All methods hang off the `hl7` decorator on the Fastify instance.

### Inbound / server

| Method | Returns | Description |
|---|---|---|
| `createInbound(name, options, handler)` | `Inbound` | Start an inbound listener on `options.port` pinned to `options.version`; `handler(req, res)` handles each message. |
| `closeServer(port)` | `Promise<boolean>` | Close the listener on `port`. |
| `closeServerAll()` | `Promise<boolean>` | Close all listeners. |
| `getServerByName(name)` | `Inbound \| undefined` | Look up a listener by name. |
| `getServerByPort(port)` | `Inbound \| undefined` | Look up a listener by port. |

The server methods throw `FASTIFY_HL7_ERR_USAGE` when the plugin was registered with
`enableServer: false`.

### Outbound / client

| Method | Returns | Description |
|---|---|---|
| `createClient(name, options)` | `Client` | Register a uniquely named client pointed at `options.host` and pinned to `options.version`. |
| `createConnection(name, options, handler)` | `Connection` | Attach an outbound connection (on `options.port`) to the client called `name`; `handler(res)` handles the reply. |
| `getClientByName(name)` | `Client \| undefined` | Look up a client by name. |
| `getClientConnectionByPort(port)` | `Connection \| undefined` | Look up an outbound connection by port. |

### Builders

| Method | Returns | Description |
|---|---|---|
| `createBuilder(version, options?)` | `HL7_2_x` | Version-pinned, **validated** builder; chain `build*` then `.toMessage()`. Rejects fields/segments not valid for the version. |
| `buildMessage(options?)` | `Message` | Build a single HL7 message directly, **unvalidated** (set `messageHeader.msh_12` to the client version). |
| `buildBatch(options?)` | `Batch` | Build an HL7 batch (BHS). |
| `buildFileBatch(options?)` | `FileBatch` | Build an HL7 file batch (FHS) for writing. |
| `buildDate(date, length?)` | `string` | Format a `Date` as an HL7 timestamp (length `8`, `12`, or `14`; default `14`). |

### Parsing & files

| Method | Returns | Description |
|---|---|---|
| `processHL7(text)` | `Batch \| Message` | Parse raw HL7 — `Batch` if it starts with BHS, else `Message`. |
| `readFile(fullFilePath)` | `FileBatch` | Read a file batch from a path. |
| `readFileBuffer(buffer)` | `FileBatch` | Read a file batch from a `Buffer`. |

## ⚙️ Plugin Options

Pass these to `app.register(fastifyHL7, options)`:

### `enableServer`

`boolean` — defaults to `true`. Set to `false` to turn off the inbound server (client-only app).
While disabled, the server-side methods throw `FASTIFY_HL7_ERR_USAGE`.

### `serverOptions`

The `ServerOptions` from
[`node-hl7-server`](https://github.com/Bugs5382/node-hl7) — `bindAddress`, encoding, TLS, and other
server-creation settings. It can only be set at registration time.

> Per-client and per-listener settings (including the required HL7 `version`, host, port, and TLS)
> are passed to `createClient` / `createConnection` / `createInbound`, not here.

## 🔌 External Libraries

This plugin documents only its own surface. For segment-by-segment message building (the class-based
`HL7_2_x` builders), transport internals, parsing, and the full client/server option sets, see the
[`node-hl7`](https://github.com/Bugs5382/node-hl7) repo, which ships both packages:

- `node-hl7-client` — Client, Parser, and Builder options.
- `node-hl7-server` — Server and Inbound options.

## 🙏 Acknowledgements

- My Wife and Baby Girl.

## 📄 License

Licensed under [MIT](./LICENSE).
