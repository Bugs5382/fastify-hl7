import Client, { HL7Outbound } from 'node-hl7-client'
import { HL7Inbound, ServerOptions } from 'node-hl7-server'

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
  connection: HL7Outbound
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
  server: HL7Inbound
}
