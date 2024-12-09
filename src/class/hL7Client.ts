import Client, {
  Batch,
  ClientBuilderFileOptions,
  ClientBuilderMessageOptions,
  ClientBuilderOptions,
  ClientListenerOptions,
  ClientOptions,
  FileBatch,
  Connection,
  isBatch,
  Message,
  OutboundHandler,
  createHL7Date,
} from "node-hl7-client";
import { AClients } from "../decorate.js";
import { errors } from "../errors.js";

export class HL7Client {
  /** @internal */
  private readonly _clientConnections: AClients[];

  constructor() {
    this._clientConnections = [];
  }

  /**
   * Close All Connections for this Client
   * @since 1.0.0
   */
  async closeAll(): Promise<boolean> {
    this._clientConnections.forEach((outbound) => {
      outbound.ports.map(async (port) => {
        await port.connection.close();
      });
    });
    return true;
  }

  /**
   * Build a HL7 Batch
   * @remarks Create a properly formatted HL7 Batch.
   * @since 1.0.0
   * @param props
   */
  buildBatch(props?: ClientBuilderOptions): Batch {
    if (typeof props !== "undefined" && typeof props.text !== "undefined") {
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "Use processMessage method. This is for building.",
      );
    }
    return new Batch({ ...props });
  }

  /**
   * Build Date
   * @remarks Build a date string based off HL7 Standards
   * @since 2.1.0
   * @param date
   * @param length Options are 8, 12, or 14 (default)
   */
  buildDate(date: Date, length?: string): string {
    return createHL7Date(date, length);
  }

  /**
   * Build a HL7 File Batch
   * @remarks Create a properly formatted HL7 File Batch.
   * @since 1.0.0
   * @param props
   */
  buildFileBatch(props?: ClientBuilderFileOptions): FileBatch {
    if (
      typeof props !== "undefined" &&
      (typeof props.fullFilePath !== "undefined" ||
        typeof props.fileBuffer !== "undefined")
    ) {
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "Use readFile or readFileBuffer method. This is for building.",
      );
    }
    return new FileBatch({ ...props });
  }

  /**
   * Build a HL7 Message
   * @remarks Create a properly formatted HL7 message.
   * @since 1.0.0
   * @param props
   */
  buildMessage(props?: ClientBuilderMessageOptions): Message {
    if (typeof props !== "undefined" && typeof props.text !== "undefined") {
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "Use processMessage method. This is for building.",
      );
    }
    return new Message({ ...props });
  }

  /**
   *
   * @param name
   * @param props
   */
  createClient(name: string, props: ClientOptions): Client {
    const nameFormat = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/; //eslint-disable-line
    if (nameFormat.test(name)) {
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~.",
      );
    }

    // make sure that this does not exist already...
    this._clientConnections.forEach((connections) => {
      if (connections.name === name) {
        throw new errors.FASTIFY_HL7_ERR_USAGE("name must be unique.");
      }
      // nto in the Client class yet
      // if (client.getHost() === props.host) {
      //   throw new errors.FASTIFY_HL7_ERR_USAGE(`host is already a pointer. Name is: ${connections.name}`)
      // }
    });

    // new client
    const client = new Client(props);

    // add it to the collection
    this._clientConnections.push({
      name,
      client,
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
    props: ClientListenerOptions,
    handler: OutboundHandler,
  ): Connection {
    const nameFormat = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/; //eslint-disable-line
    if (nameFormat.test(name)) {
      throw new errors.FASTIFY_HL7_ERR_USAGE(
        "name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~.",
      );
    }

    const getConnection = this._clientConnections.find(
      (client) => client.name === name,
    );

    if (typeof getConnection !== "undefined") {
      // make sure port is not used all ready
      getConnection.ports.forEach((outbound) => {
        if (outbound.port === props.port.toString()) {
          throw new errors.FASTIFY_HL7_ERR_USAGE(
            `port ${props.port} is already used with this client. Choose a new outgoing port.`,
          );
        }
      });

      // create outbound port to the server in getConnection.client
      const outbound = new Connection(getConnection.client, props, handler);

      // add it to the array of known ports. need to know this, so we can get it later if needed.
      getConnection.ports.push({
        port: props.port.toString(),
        connection: outbound,
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
    if (typeof connection !== "undefined") {
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
    this._clientConnections.forEach((outbound) => {
      outbound.ports.forEach((aPort) => {
        if (aPort.port === port) {
          connection = aPort.connection;
        }
      });
    });
    return connection;
  }

  /**
   * Process a HL7
   * @remarks A HL7 message that could either be a Message (MSH) or Batch (BHS)
   * @since 1.0.0
   * @param text Raw HL& String
   */
  processHL7(text: string): Message | Batch {
    if (isBatch(text)) {
      return new Batch({ text });
    } else {
      return new Message({ text });
    }
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
