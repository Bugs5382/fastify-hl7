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

```ts
// A single message — MSH.12 must match the sending client's version.
const message = app.hl7.buildMessage({
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

> Building takes the message/batch/builder options from `node-hl7-client`. `buildFileBatch` is for
> *creating* a file batch — to read an existing one, use `readFile` / `readFileBuffer`
> ([recipe 5](#5-parse-inbound-hl7-and-read-files)). For the richer class-based builder
> (`new HL7_2_7().buildMSH(...).buildPID(...)`), see the node-hl7-client docs.

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
| `buildMessage(options?)` | `Message` | Build a single HL7 message (set `messageHeader.msh_12` to the client version). |
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
