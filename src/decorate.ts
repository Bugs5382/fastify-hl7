import Client, { ClientListenerOptions, ClientOptions, HL7Outbound } from 'node-hl7-client'
import { HL7Inbound, ServerOptions } from 'node-hl7-server'

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

interface AClientPorts {
  [port: string]: HL7Outbound
}

export interface AClients {
  name: string
  client: Client
  ports: AClientPorts[]
}

export interface AServers {
  port: string
  server: HL7Inbound
}
