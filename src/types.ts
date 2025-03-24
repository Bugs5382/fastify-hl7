import Server, {
  Inbound,
  InboundHandler,
  ListenerOptions,
} from "node-hl7-server";
import Client, {
  Batch,
  ClientBuilderFileOptions,
  ClientBuilderMessageOptions,
  ClientBuilderOptions,
  ClientListenerOptions,
  ClientOptions,
  Connection,
  FileBatch,
  Message,
  OutboundHandler,
} from "node-hl7-client";

declare module "fastify" {
  export interface HL7 {
    /** Server Instance
     * @since 1.0.0 **/
    _serverInstance?: Server;
    /** Build HL7 Batch
     * @since 1.0.0 */
    buildBatch: (props?: ClientBuilderOptions) => Batch;
    /** Build Date
     * @remarks Build a date string based off HL7 Standards
     * @param date
     * @param length Options are 8, 12, or 14 (default)
     * @since 2.1.0
     */
    buildDate: (date: Date, length?: string) => string;
    /** Build HL7 File Batch
     * @since 1.0.0 */
    buildFileBatch: (props?: ClientBuilderFileOptions) => FileBatch;
    /** Build HL7 Message
     * @since 1.0.0 */
    buildMessage: (props?: ClientBuilderMessageOptions) => Message;
    /** Close a incoming HL7 port.
     * @since 1.0.0 */
    closeServer: (port: string) => Promise<boolean>;
    /** Close all incoming HL7 ports.
     * @since 1.0.0 */
    closeServerAll: () => Promise<boolean>;
    /** Create Client
     * @remarks Connecting to a remote server/broker that accepts connections.
     * @since 1.0.0 */
    createClient: (name: string, props: ClientOptions) => Client;
    /** Create an incoming port connection on the server.
     * @since 1.0.0 */
    createInbound: (
      name: string,
      props: ListenerOptions,
      handler: InboundHandler,
    ) => Inbound;
    /** Create Outgoing Client Port
     * @remarks This is on the established client that we are already a part off.
     * @since 1.0.0 */
    createConnection: (
      name: string,
      props: ClientListenerOptions,
      handler: OutboundHandler,
    ) => Connection;
    /** Get Client (Outbound) connection by name.
     * @since 1.0.0 */
    getClientByName: (name: string) => Client | undefined;
    /** Get Client Connection (Outbound) connection by port.
     * @since 1.0.0 */
    getClientConnectionByPort: (port: string) => Connection | undefined;
    /** Get Server (Inbound) connection by port.
     * @since 1.0.0 */
    getServerByPort: (port: string) => Inbound | undefined;
    /** Get Server (Inbound) connection by name.
     * @since 1.0.0 */
    getServerByName: (name: string) => Inbound | undefined;
    /** Process an HL7 string.
     * @since 1.0.0  */
    processHL7: (text: string) => Message | Batch;
    /** Read a file from a path.
     * @since 1.0.0 */
    readFile: (fullFilePath: string) => FileBatch;
    /** Read a buffer that was a file batch.
     * @since 1.0.0 */
    readFileBuffer: (fileBuffer: Buffer) => FileBatch;
  }

  export interface FastifyInstance {
    /** Main Decorator for Fastify
     * @remarks hl7 is the decorator that everything hangs off.
     * @since 1.0.0 **/
    hl7: HL7;
  }
}
