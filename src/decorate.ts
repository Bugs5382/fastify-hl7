import Client, { ClientListenerOptions, ClientOptions, HL7Outbound, OutboundHandler } from 'node-hl7-client'
import { InboundHandler, ListenerOptions, ServerOptions } from 'node-hl7-server'

/**
 * @since 1.0.0
 */
export interface FastifyHL7Options {
  /** Default Client Options to use if we start a client.
   * 'host' will need to be passed on.
   * @since 1.0.0 */
  clientOptions?: ClientOptions
  /** Default Client Listener Options to use if we start a client.
   * 'port' will need to be passed on.
   * @since 1.0.0 */
  clientListenerOptions?: ClientListenerOptions
  /** Enable Server Instance for Inbound
   * @since 1.0.0
   * @default true */
  enableServer?: boolean
  /** Override Server Options
   * @default From node-hl7-server */
  serverOptions?: ServerOptions
}

interface AHL7 {
  name: string
  port: string
}

export interface AHL7Inbound extends AHL7 {
  handler: InboundHandler
  options: ListenerOptions
}

export interface AHL7Outbound extends AHL7 {
  handler: OutboundHandler
  options: ClientListenerOptions
}

export interface AClientPorts {
  [port: string]: HL7Outbound
}

export interface AClients {
  name: string
  client: Client
}
