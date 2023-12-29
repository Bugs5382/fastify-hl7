import Server, { HL7Inbound, InboundHandler, ListenerOptions } from 'node-hl7-server'
import {
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
    /** Server Instance **/
    _serverInstance?: Server
    /** */
    buildBatch: (props?: ClientBuilderOptions) => Batch
    /** */
    buildFileBatch: (props?: ClientBuilderFileOptions) => FileBatch
    /** */
    buildMessage: (props?: ClientBuilderMessageOptions) => Message
    /** */
    closeServer: (port: string) => Promise<boolean>
    /** */
    closeServerAll: () => Promise<boolean>
    /** Create Client */
    createClient: (name: string, props: ClientOptions) => void
    /** */
    createInbound: (props: ListenerOptions, handler: InboundHandler) => HL7Inbound
    /** Create Outgoing Client Port */
    createOutbound: (name: string, props: ClientListenerOptions, handler: OutboundHandler) => HL7Outbound
    /** */
    processHL7: (text: string) => Message | Batch
    /** */
    readFile: (fullFilePath: string) => FileBatch
    /** */
    readFileBuffer: (fileBuffer: Buffer) => FileBatch
  }

  export interface FastifyInstance {
    /** Main Decorator for Fastify **/
    hl7: HL7
  }
}
