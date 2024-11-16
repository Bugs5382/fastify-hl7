import Server, {
  Inbound,
  InboundHandler,
  ListenerOptions,
} from "node-hl7-server";
import { AServers } from "../decorate.js";
import { errors } from "../errors.js";

export class HL7Server {
  private readonly _server: Server;
  private readonly _serverInboundConnections: AServers[];

  constructor(server: Server) {
    this._server = server;
    this._serverInboundConnections = [];
  }

  /**
   * Close Inbound connection.
   * @since 1.0.0
   * @param port
   */
  async close(port: string): Promise<boolean> {
    const inbound = this._serverInboundConnections.find(
      (server) => server.port === port,
    );
    if (typeof inbound !== "undefined") {
      return await inbound.server.close(); // close the server for all inbound connections
    }
    throw new errors.FASTIFY_HL7_ERR_USAGE(
      `No inbound server listening on port: ${port}`,
    );
  }

  /**
   * Close all Inbound connections.
   * @since 1.0.0
   */
  async closeAll(): Promise<boolean> {
    this._serverInboundConnections.map(async (inbound) => {
      await inbound.server.close();
    });
    return true;
  }

  /**
   * Create Inbound connection.
   * @since 1.0.0
   * @param name
   * @param props
   * @param handler
   */
  createInbound(
    name: string,
    props: ListenerOptions,
    handler: InboundHandler,
  ): Inbound {
    const nameFormat = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/; //eslint-disable-line
    if (nameFormat.test(name)) {
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~.",
      );
    }

    const inbound = new Inbound(this._server, props, handler);

    this._serverInboundConnections.push({
      name,
      port: props.port.toString(),
      server: inbound,
    });
    return inbound;
  }

  /**
   * Get Server Inbound Connection by Name
   * @since 1.0.0
   * @param name
   */
  getServerByName(name: string): Inbound | undefined {
    const inbound = this._serverInboundConnections.find(
      (inbound) => inbound.name === name,
    );
    if (typeof inbound !== "undefined") {
      return inbound.server;
    }
    return undefined;
  }

  /**
   * Get Server Inbound Connection by Port
   * @since 1.0.0
   * @param port
   */
  getServerByPort(port: string): Inbound | undefined {
    const inbound = this._serverInboundConnections.find(
      (inbound) => inbound.port === port,
    );
    if (typeof inbound !== "undefined") {
      return inbound.server;
    }
    return undefined;
  }
}
