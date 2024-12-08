import { FastifyInstance, HL7 } from "fastify";
import fp from "fastify-plugin";
import Client, {
  Batch,
  ClientBuilderFileOptions,
  ClientBuilderMessageOptions,
  ClientBuilderOptions,
  FileBatch,
  Connection,
  Message,
} from "node-hl7-client";
import Server, {
  Inbound,
  InboundHandler,
  ListenerOptions,
} from "node-hl7-server";
import { HL7Server } from "./class/hL7Server.js";
import { HL7Client } from "./class/hL7Client.js";
import { FastifyHL7Options } from "./decorate.js";
import { errors } from "./errors.js";
import { validateOpts } from "./validation.js";
export * from "./types.js";

/**
 * @since 1.0.0
 * @param fastify
 * @param _opts
 * @param connection
 */
const decorateFastifyInstance = (
  fastify: FastifyInstance,
  _opts: FastifyHL7Options,
  connection: HL7,
): void => {
  if (typeof fastify.hl7 !== "undefined") {
    throw new errors.FASTIFY_HL7_ERR_SETUP_ERRORS("Already registered.");
  }

  if (typeof fastify.hl7 === "undefined") {
    fastify.log.trace("[fastify-hl7] Decorate Fastify");
    fastify.decorate("hl7", connection);
  }
};

const fastifyHL7 = fp<FastifyHL7Options>(async (fastify, opts) => {
  const generatedOpts = await validateOpts(opts);
  opts = { ...opts, ...generatedOpts };

  // Create server.
  // Since there can only be one server per IP address
  // (i.e., the host this is running on.) There can only be more than one.
  // A server can host many HL7 Inbound connections via different ports, this is fine.
  // Clients are different as an app could talk to different servers, on many ports.
  // So we need to do something different.
  const serverInstance =
    typeof opts.enableServer !== "undefined" && opts.enableServer
      ? new Server(opts.serverOptions)
      : undefined;

  // Server Functions
  let server: HL7Server | undefined;
  if (typeof serverInstance !== "undefined") {
    // Server Functions
    server = new HL7Server(serverInstance);

    server.on("inbound", (port: string) => {
      fastify.log.info("HL7 Inbound Server Listening on Port %s", port);
    });

    // before we close fastify, make sure all server instances are closed
    fastify.addHook("preClose", async () => {
      if (typeof server !== "undefined") {
        await server.closeAll();
      }
    });
  }

  // Client Functions
  const client = new HL7Client();

  // run these before fastify closes
  fastify.addHook("preClose", async () => {
    if (typeof client !== "undefined") {
      await client.closeAll();
    }
  });

  decorateFastifyInstance(fastify, opts, {
    _serverInstance: serverInstance,
    buildBatch: function (props: ClientBuilderOptions | undefined): Batch {
      return client.buildBatch(props);
    },
    buildDate: function (date: Date, length?: string): string {
      return client.buildDate(date, length);
    },
    buildFileBatch: function (
      props: ClientBuilderFileOptions | undefined,
    ): FileBatch {
      return client.buildFileBatch(props);
    },
    buildMessage: function (
      props: ClientBuilderMessageOptions | undefined,
    ): Message {
      return client.buildMessage(props);
    },
    closeServer: async function (port: string): Promise<boolean> {
      if (typeof server !== "undefined") {
        return await server.close(port);
      }
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "server was not started. re-register plugin with enableServer set to true.",
      );
    },
    closeServerAll: async (): Promise<boolean> => {
      if (typeof server !== "undefined") {
        return await server.closeAll();
      }
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "server was not started. re-register plugin with enableServer set to true.",
      );
    },
    createClient: function (name, props): Client {
      return client.createClient(name, props);
    },
    createInbound: function (
      name: string,
      props: ListenerOptions,
      handler: InboundHandler,
    ): Inbound {
      if (typeof server !== "undefined") {
        return server.createInbound(name, props, handler);
      }
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "server was not started. re-register plugin with enableServer set to true.",
      );
    },
    createConnection: function (name, props, handler) {
      return client.createConnection(name, props, handler);
    },
    getClientByName: function (name: string): Client | undefined {
      return client.getClientByName(name);
    },
    getClientConnectionByPort: function (port: string): Connection | undefined {
      return client.getClientConnectionByPort(port);
    },
    getServerByName: function (name: string): Inbound | undefined {
      if (typeof server !== "undefined") {
        return server.getServerByName(name);
      }
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "server was not started. re-register plugin with enableServer set to true.",
      );
    },
    getServerByPort: function (port: string): Inbound | undefined {
      if (typeof server !== "undefined") {
        return server.getServerByPort(port);
      }
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "server was not started. re-register plugin with enableServer set to true.",
      );
    },
    processHL7: function (text: string): Message | Batch {
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
export { FastifyHL7Options };
