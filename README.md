# Fastify HL7

A Fastify Hl7 Plugin Developed in Pure TypeScript.
It uses the [node-hl7-client](https://github.com/Bugs5382/node-hl7-client) and [node-hl7-server](https://github.com/Bugs5382/node-hl7-server) plugin as a wrapper.

The build exports this to valid ESM and CJS for ease of cross-compatibility.

If you are using this NPM package, please consider giving it a :star: star.
This will increase its visibility and solicit more contribution from the outside.

This documentation is how to use this plugin, not on how to use the libraries above.
Head [here](#external-libraries-options) if you need help with those.

## Table of Contents

1. [Install](#install)
2. [Basic Usage](#basic-usage)
   1. [Server Quick Start](#server-quick-start)
   2. [Client Quick Start](#client-quick-start)
3. [Full Documentation](#full-documentation)
   1. [This Library Options](#this-library-options)
   2. [External Libraries Options](#external-libraries-options)
4. [Acknowledgements](#acknowledgements)
5. [License](#license)

## Install

```
npm install fastify-hl7
```

## Basic Usage

Register this as a plugin.

```ts
await fastify.register(fastifyHL7);
```

### Server Quick Start

```ts
const listener = fastify.hl7.createInbound(
  "ib_adt",
  { port: 3001 },
  async (req, res) => {
    const messageReq = req.getMessage();
    const messageType = req.getType();
    // your logic here
    await res.sendResponse("AA");
  },
);
```

This will create a inbound connection. You can optionally return it to a variable to attach advanced listeners.

### Client Quick Start

```ts
import fastify from "fastify";

fastify.hl7.createClient("localhost", { host: "0.0.0.0" });
```

This will create a "client" class that will then allow you to attach different outbound connections.
The name `localhost` in a unique identifier to this host, so it can be used to attach different outbound connections to this server/broker.

There might be times when your HL7 messages need to cross-over to different hosts/server/inbound endpoints and this is how you would get them.

Within your code now you can use the fastify context and access the `hl7` decorator,
and create an outbound connection.

```ts
const client = fastify.hl7.createConnection(
  "ob_adt",
  { port: 3001 },
  async (res) => {
    const messageRes = res.getMessage();
    // Your code here. Either a failure or a success, but still do your work here.
  },
);

// building a HL7 Message Segment
const message = app.hl7.buildMessage({
  messageHeader: {
    msh_9_1: "ADT",
    msh_9_2: "A01",
    msh_11_1: "D",
  },
});

await client.sendMessage(message);
```

## Full Documentation

### This Library Options

### `enableServer`

If this is not set, enableServer will be set to `true`. You need to set this to `false` will turn off the server capabilities.

### `serverOptions`

Set this using the options from the [node-hl7-serer](https://github.com/Bugs5382/node-hl7-server/blob/main/README.md) library ServerOptions values to override server creation.
This could be enabling IPv4 or IPv6 and other server options including TLS. Since you cannot set this after run time, it has to be set during registration.

### External Libraries Options

- [node-hl7-client](https://github.com/Bugs5382/node-hl7-client/blob/main/README.md) - For the Client, Parser, and Builder to review their options that can be passed as props.
- [node-hl7-server](https://github.com/Bugs5382/node-hl7-server/blob/main/README.md) - For the Server to the options that can be passed as props.

Please review the libraries for more complete documentation.

## Acknowledgements

- My Wife and Baby Girl.

## License

Licensed under [MIT](./LICENSE).
