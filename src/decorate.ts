import Client, { Connection } from 'node-hl7-client'
import { Inbound, ServerOptions } from 'node-hl7-server'

/**
 * @since 1.0.0
 */
export interface FastifyHL7Options {
  /** Enable Server Instance for Inbound
   * @since 1.0.0
   * @default true */
  enableServer?: boolean
  /** Override Server Options
   * @default From node-hl7-server */
  serverOptions?: ServerOptions
}

/**
 * @since 1.0.0
 */
interface AClientPorts {
  port: string
  connection: Connection
}

/**
 * @since 1.0.0
 */
export interface AClients {
  name: string
  client: Client
  ports: AClientPorts[]
}

/**
 * @since 1.0.0
 */
export interface AServers {
  name: string
  port: string
  server: Inbound
}
