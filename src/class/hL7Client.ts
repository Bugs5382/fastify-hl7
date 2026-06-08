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
import Client, {
  Batch,
  ClientBuilderFileOptions,
  ClientBuilderMessageOptions,
  ClientBuilderOptions,
  ClientListenerOptions,
  ClientOptions,
  Connection,
  createHL7Date,
  FileBatch,
  isBatch,
  Message,
  OutboundHandler,
} from "node-hl7-client";

import { AClients } from "../decorate.js";
import { errors } from "../errors.js";

/** Accepted HL7 date-length values, derived from node-hl7-client's
 * `createHL7Date` so it stays in sync with the upstream type. */
export type DateLength = Parameters<typeof createHL7Date>[1];

export class HL7Client {
  /** @internal */
  private readonly _clientConnections: AClients[];

  constructor() {
    this._clientConnections = [];
  }

  /**
   * Build a HL7 Batch
   * @remarks Create a properly formatted HL7 Batch.
   * @since 1.0.0
   * @param props
   */
  buildBatch(properties?: ClientBuilderOptions): Batch {
    return new Batch({ ...properties });
  }

  /**
   * Build Date
   * @remarks Build a date string based off HL7 Standards
   * @since 2.1.0
   * @param date
   * @param length Options are 8, 12, or 14 (default)
   */
  buildDate(date: Date, length?: DateLength): string {
    return createHL7Date(date, length);
  }

  /**
   * Build a HL7 File Batch
   * @remarks Create a properly formatted HL7 File Batch.
   * @since 1.0.0
   * @param props
   */
  buildFileBatch(properties?: ClientBuilderFileOptions): FileBatch {
    if (
      properties !== undefined &&
      (properties.fullFilePath !== undefined ||
        properties.fileBuffer !== undefined)
    ) {
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "Use readFile or readFileBuffer method. This is for building.",
      );
    }
    return new FileBatch({ ...properties });
  }

  /**
   * Build a HL7 Message
   * @remarks Create a properly formatted HL7 message.
   * @since 1.0.0
   * @param props
   */
  buildMessage(properties?: ClientBuilderMessageOptions): Message {
    if (properties !== undefined && properties.text !== undefined) {
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "Use processMessage method. This is for building.",
      );
    }
    return new Message({ ...properties });
  }

  /**
   * Close All Connections for this Client
   * @since 1.0.0
   */
  async closeAll(): Promise<boolean> {
    for (const outbound of this._clientConnections) {
      outbound.ports.map(async (port) => {
        await port.connection.close();
      });
    }
    return true;
  }

  /**
   *
   * @param name
   * @param props
   */
  createClient(name: string, properties: ClientOptions): Client {
    const nameFormat = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/;
    if (nameFormat.test(name)) {
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~.",
      );
    }

    // make sure that this does not exist already...
    for (const connections of this._clientConnections) {
      if (connections.name === name) {
        throw new errors.FASTIFY_HL7_ERR_USAGE("name must be unique.");
      }
      // nto in the Client class yet
      // if (client.getHost() === props.host) {
      //   throw new errors.FASTIFY_HL7_ERR_USAGE(`host is already a pointer. Name is: ${connections.name}`)
      // }
    }

    // new client
    const client = new Client(properties);

    // add it to the collection
    this._clientConnections.push({
      client,
      name,
      ports: [],
    });

    return client;
  }

  /**
   * Create an HL7 Outbound Connection
   * @remarks Connect to an HL7 Server/Broker
   * @since 1.0.0
   * @param name The name stored within created client connections.
   * @param props
   * @param handler
   */
  createConnection(
    name: string,
    properties: ClientListenerOptions,
    handler: OutboundHandler,
  ): Connection {
    const nameFormat = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/;
    if (nameFormat.test(name)) {
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~.",
      );
    }

    const getConnection = this._clientConnections.find(
      (client) => client.name === name,
    );

    if (getConnection !== undefined) {
      // make sure port is not used all ready
      for (const outbound of getConnection.ports) {
        if (outbound.port === properties.port.toString()) {
          throw new errors.FASTIFY_HL7_ERR_USAGE(
            `port ${properties.port} is already used with this client. Choose a new outgoing port.`,
          );
        }
      }

      // create outbound port to the server in getConnection.client
      const outbound = new Connection(
        getConnection.client,
        properties,
        handler,
      );

      // add it to the array of known ports. need to know this, so we can get it later if needed.
      getConnection.ports.push({
        connection: outbound,
        port: properties.port.toString(),
      });

      // return it right away. the user might do something with it.
      return outbound;
    }

    throw new errors.FASTIFY_HL7_ERR_USAGE(
      "No valid client. Improper setup of a outbound connection.",
    );
  }

  /**
   * Get Client by the name
   * @since 1.0.0
   * @param name
   */
  getClientByName(name: string): Client | undefined {
    const connection = this._clientConnections.find(
      (connection) => connection.name === name,
    );
    if (connection !== undefined) {
      return connection.client;
    }
    return undefined;
  }

  /**
   * Get Connection by Port
   * @since 1.0.0
   * @param port
   */
  getClientConnectionByPort(port: string): Connection | undefined {
    let connection: Connection | undefined;
    for (const outbound of this._clientConnections) {
      for (const aPort of outbound.ports) {
        if (aPort.port === port) {
          connection = aPort.connection;
        }
      }
    }
    return connection;
  }

  /**
   * Process a HL7
   * @remarks A HL7 message that could either be a Message (MSH) or Batch (BHS)
   * @since 1.0.0
   * @param text Raw HL& String
   */
  processHL7(text: string): Batch | Message {
    return isBatch(text) ? new Batch({ text }) : new Message({ text });
  }

  /**
   * Read File
   * @remarks Pass the correct path of the file you want to read.
   * @since 1.0.0
   * @param fullFilePath
   * @returns FileBatch
   * @example
   * ```ts
   * fastify.hl7.readFile( path.join('temp/', 'hl7.readTestBHS.20231208.hl7') )
   * ```
   */
  readFile(fullFilePath: string): FileBatch {
    return new FileBatch({ fullFilePath });
  }

  /**
   * Read a File Buffer
   * @remarks Translate an already Buffered HL7 FHS segment to decode it.
   * @since 1.0.0
   * @param fileBuffer
   * @returns FileBatch
   * @example
   * ```ts
   * const fileBuffer = fs.readFileSync(path.join('temp/', 'hl7.readTestBHS.20231208.hl7'))
   * fastify.hl7.readFileBuffer(fileBuffer)
   * ```
   */
  readFileBuffer(fileBuffer: Buffer): FileBatch {
    return new FileBatch({ fileBuffer });
  }
}
