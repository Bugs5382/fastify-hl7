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
import Server, {
  Inbound,
  InboundHandler,
  ListenerOptions,
} from "node-hl7-server";
import { EventEmitter } from "node:events";

import { AServers } from "../decorate.js";
import { errors } from "../errors.js";

export class HL7Server extends EventEmitter {
  private readonly _server: Server;
  private readonly _serverInboundConnections: AServers[];

  constructor(server: Server) {
    super();
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
    if (inbound !== undefined) {
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
    properties: ListenerOptions,
    handler: InboundHandler,
  ): Inbound {
    const nameFormat = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/;
    if (nameFormat.test(name)) {
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~.",
      );
    }

    const inbound = new Inbound(this._server, properties, handler);

    this._serverInboundConnections.push({
      name,
      port: properties.port.toString(),
      server: inbound,
    });

    this.emit("inbound", properties.port.toString());

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
    if (inbound !== undefined) {
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
    if (inbound !== undefined) {
      return inbound.server;
    }
    return undefined;
  }
}
