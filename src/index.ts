/*
MIT License

Copyright (c) 2026 Shane Froebel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/
import { FastifyInstance, HL7 } from "fastify";
import fp from "fastify-plugin";
import Client, {
  Batch,
  ClientBuilderFileOptions,
  ClientBuilderMessageOptions,
  ClientBuilderOptions,
  Connection,
  FileBatch,
  HL7Version,
  Message,
} from "node-hl7-client";
import Server, {
  Inbound,
  InboundHandler,
  ListenerOptions,
} from "node-hl7-server";

import type { FastifyHL7Options } from "./decorate.js";

import {
  type DateLength,
  HL7Client,
  type HL7VersionBuilders,
} from "./class/hL7Client.js";
import { HL7Server } from "./class/hL7Server.js";
import { errors } from "./errors.js";
import { validateOpts as validateOptions } from "./validation.js";
export { type FastifyHL7Options } from "./decorate.js";

/**
 * @since 1.0.0
 * @param fastify
 * @param _opts
 * @param connection
 */
const decorateFastifyInstance = (
  fastify: FastifyInstance,
  _options: FastifyHL7Options,
  connection: HL7,
): void => {
  if (fastify.hl7 !== undefined) {
    throw new errors.FASTIFY_HL7_ERR_SETUP_ERRORS("Already registered.");
  }

  if (fastify.hl7 === undefined) {
    fastify.log.trace("[fastify-hl7] Decorate Fastify");
    fastify.decorate("hl7", connection);
  }
};

const fastifyHL7 = fp<FastifyHL7Options>(async (fastify, options) => {
  const generatedOptions = await validateOptions(options);
  options = { ...options, ...generatedOptions };

  // Create server.
  // Since there can only be one server per IP address
  // (i.e., the host this is running on.) There can only be more than one.
  // A server can host many HL7 Inbound connections via different ports, this is fine.
  // Clients are different as an app could talk to different servers, on many ports.
  // So we need to do something different.
  const serverInstance =
    options.enableServer !== undefined && options.enableServer
      ? new Server(options.serverOptions)
      : undefined;

  // Server Functions
  let server: HL7Server | undefined;
  if (serverInstance !== undefined) {
    // Server Functions
    server = new HL7Server(serverInstance);

    server.on("inbound", (port: string) => {
      fastify.log.info("HL7 Inbound Server Listening on Port %s", port);
    });

    // before we close fastify, make sure all server instances are closed
    fastify.addHook("preClose", async () => {
      if (server !== undefined) {
        await server.closeAll();
      }
    });
  }

  // Client Functions
  const client = new HL7Client();

  // run these before fastify closes
  fastify.addHook("preClose", async () => {
    if (client !== undefined) {
      await client.closeAll();
    }
  });

  decorateFastifyInstance(fastify, options, {
    _serverInstance: serverInstance,
    buildBatch: function (properties: ClientBuilderOptions | undefined): Batch {
      return client.buildBatch(properties);
    },
    buildDate: function (date: Date, length?: DateLength): string {
      return client.buildDate(date, length);
    },
    buildFileBatch: function (
      properties: ClientBuilderFileOptions | undefined,
    ): FileBatch {
      return client.buildFileBatch(properties);
    },
    buildMessage: function (
      properties: ClientBuilderMessageOptions | undefined,
    ): Message {
      return client.buildMessage(properties);
    },
    closeServer: async function (port: string): Promise<boolean> {
      if (server !== undefined) {
        return await server.close(port);
      }
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "server was not started. re-register plugin with enableServer set to true.",
      );
    },
    closeServerAll: async (): Promise<boolean> => {
      if (server !== undefined) {
        return await server.closeAll();
      }
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "server was not started. re-register plugin with enableServer set to true.",
      );
    },
    createBuilder: function <V extends HL7Version>(
      version: V,
      properties?: ClientBuilderOptions,
    ): HL7VersionBuilders[V] {
      return client.createBuilder(version, properties);
    },
    createClient: function (name, properties): Client {
      return client.createClient(name, properties);
    },
    createConnection: function (name, properties, handler) {
      return client.createConnection(name, properties, handler);
    },
    createInbound: function (
      name: string,
      properties: ListenerOptions,
      handler: InboundHandler,
    ): Inbound {
      if (server !== undefined) {
        return server.createInbound(name, properties, handler);
      }
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "server was not started. re-register plugin with enableServer set to true.",
      );
    },
    getClientByName: function (name: string): Client | undefined {
      return client.getClientByName(name);
    },
    getClientConnectionByPort: function (port: string): Connection | undefined {
      return client.getClientConnectionByPort(port);
    },
    getServerByName: function (name: string): Inbound | undefined {
      if (server !== undefined) {
        return server.getServerByName(name);
      }
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "server was not started. re-register plugin with enableServer set to true.",
      );
    },
    getServerByPort: function (port: string): Inbound | undefined {
      if (server !== undefined) {
        return server.getServerByPort(port);
      }
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "server was not started. re-register plugin with enableServer set to true.",
      );
    },
    processHL7: function (text: string): Batch | Message {
      return client.processHL7(text);
    },
    readFile: function (fullFilePath: string): FileBatch {
      return client.readFile(fullFilePath);
    },
    readFileBuffer: function (fileBuffer: Buffer): FileBatch {
      return client.readFileBuffer(fileBuffer);
    },
  });
});

export default fastifyHL7;

export * from "./types.js";
