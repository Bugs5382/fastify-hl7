# Fastify HL7

A Fastify Hl7 Plugin Developed in Pure TypeScript.
It uses the [node-hl7-client](https://github.com/Bugs5382/node-hl7-client) and [node-hl7-server](https://github.com/Bugs5382/node-hl7-server) plugin as a wrapper.

The build exports this to valid ESM and CJS for ease of cross-compatibility.

If you are using this NPM package, please consider giving it a :star: star.
This will increase its visibility and solicit more contribution from the outside.

This documentation is how to use this plugin, not on how to use the libraries above.

## Table of Contents

1. [Install](#install)
2. [Basic Usage](#basic-usage)
3. [Full Documentation](#full-documentation)
4. [Acknowledgements](#acknowledgements)
5. [License](#license)

## Install

```
npm install fastify-hl7
```

## Basic Usage

Register this as a plugin.
Make sure it is loaded before any ***routes*** are loaded.

```ts
import fastify from 'fastify';
import fastifyHL7, {FastifyHL7Options} from 'fastify-hl7'
import {Hl7Inbound} from "node-hl7-server";

export default fp<FastifyHL7Options>((fastify, options, done) => {

   void fastify.register(fastifyHL7)

   let IB_ADT
   void fastify.ready().then(async () => {
      const server: Server = fastify.hl7.CreateServer() // uses default 0.0.0.0
      IB_ADT: Hl7Inbound = fastify.hl7.createInbound({ port: 3123 }, async (req, res) => { 
        // do something here
        await res.sendResponse('AA') // sends the client that we processed the HL7 message successfully.
      }) 
   })

   void fastify.addHook('preClose', (instance, done) => {
     IB_ADT.close() // on fastify close, lets kill our server listening on port 3123
      done()
   })

});
```

You would not call the client in your plugin. That you would do in your routes.
You could always decorate a client so be universal in your app to a universal client connection.

```ts
// done in the plugin -- START
const client: Client = fastify.hl7.CreateClient({ host: '0.0.0.0' }) // uses default 0.0.0.0

fastify.decorateRequest('hl7', client)
// done in the plugin -- END
```
or

```ts
// done in the plugin -- START
const client: Client = fastify.hl7.CreateClient({host: '0.0.0.0'}) // uses default 0.0.0.0

const OB = client.createOutbound({port: 3123}, async (res: InboundResponse) => {
   const messageRes = res.getMessage()
   const success = messageRes.get('MSA.1').toString()
   if (success === "AA") {
     // we did a good job!
   }
})

fastify.decorateRequest('hl7_port_3123', OB)
// done in the plugin -- WNS


fastify.get('/process/request', async function (request, reply) {

   const hl7Object: Message = new fastify.hl7.CreateMessage( { /** .. options needed */ })
   await request.hl7_port_3123.sendMessage(hl7Object)
   
})
```

## Full Documentation

* [node-hl7-client](https://github.com/Bugs5382/node-hl7-client/blob/main/README.md) - For the Client, Parser, and Builder.
* [node-hl7-server](https://github.com/Bugs5382/node-hl7-server/blob/main/README.md) - For the Server.

Please review the library for more complete documentation.
A far as this plugin for Fastify, there are no options to pass.

## Acknowledgements

- My Wife and Baby Girl.

## License

Licensed under [MIT](LICENSE).