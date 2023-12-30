import Server, { HL7Inbound, InboundHandler, ListenerOptions } from 'node-hl7-server'
import Client, {
  Batch, ClientBuilderFileOptions,
  ClientBuilderMessageOptions, ClientBuilderOptions,
  ClientListenerOptions,
  ClientOptions, FileBatch,
  HL7Outbound,
  Message,
  OutboundHandler
} from 'node-hl7-client'

declare module 'fastify' {

  export interface HL7 {
    /** Server Instance
     * @since 1.0.0 **/
    _serverInstance?: Server
    /** Build HL7 Batch
     * @since 1.0.0 */
    buildBatch: (props?: ClientBuilderOptions) => Batch
    /** Build HL7 File Batch
     * @since 1.0.0 */
    buildFileBatch: (props?: ClientBuilderFileOptions) => FileBatch
    /** Build HL7 Message
     * @since 1.0.0 */
    buildMessage: (props?: ClientBuilderMessageOptions) => Message
    /** Close a incoming HL7 port.
     * @since 1.0.0 */
    closeServer: (port: string) => Promise<boolean>
    /** Close all incoming HL7 ports.
     * @since 1.0.0 */
    closeServerAll: () => Promise<boolean>
    /** Create Client
     * @description Connecting to a remote server/broker that accepts connections.
     * @since 1.0.0 */
    createClient: (name: string, props: ClientOptions) => Client
    /** Create an incoming port connection on the server.
     * @since 1.0.0 */
    createInbound: (name: string, props: ListenerOptions, handler: InboundHandler) => HL7Inbound
    /** Create Outgoing Client Port
     * @description This is on the established client that we are already a part off.
     * @since 1.0.0 */
    createOutbound: (name: string, props: ClientListenerOptions, handler: OutboundHandler) => HL7Outbound
    /** Get Client (Outbound) connection by name.
     * @since 1.0.0 */
    getClientByName: (name: string) => Client | undefined
    /** Get Client Connection (Outbound) connection by port.
     * @since 1.0.0 */
    getClientConnectionByPort: (port: string) => HL7Outbound | undefined
    /** Get Server (Inbound) connection by port.
     * @since 1.0.0 */
    getServerByPort: (port: string) => HL7Inbound | undefined
    /** Get Server (Inbound) connection by name.
     * @since 1.0.0 */
    getServerByName: (name: string) => HL7Inbound | undefined
    /** Process an HL7 string.
     * @since 1.0.0  */
    processHL7: (text: string) => Message | Batch
    /** Read a file from a path.
     * @since 1.0.0 */
    readFile: (fullFilePath: string) => FileBatch
    /** Read a buffer that was a file batch.
     * @since 1.0.0 */
    readFileBuffer: (fileBuffer: Buffer) => FileBatch
  }

  export interface FastifyInstance {
    /** Main Decorator for Fastify
     * @description hl7 is the decorator that everything hangs off.
     * @since 1.0.0 **/
    hl7: HL7
  }
}
