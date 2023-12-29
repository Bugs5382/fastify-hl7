import Server from 'node-hl7-server'
import { ClientListenerOptions, ClientOptions, HL7Outbound, OutboundHandler } from 'node-hl7-client'
import { AHL7Inbound, AHL7Outbound } from './decorate.js'

declare module 'fastify' {

  export interface HL7 {
    /** Server Instance **/
    _serverInstance?: Server
    /** Create Client */
    createClient: (name: string, props?: ClientOptions) => void
    /** Create Outgoing Client Port */
    createOutbound: (name: string, props: ClientListenerOptions, handler: OutboundHandler) => HL7Outbound
    /** An array of inbound connections. */
    inbound?: AHL7Inbound[]
    /** An array of outbound connections. */
    outbound?: AHL7Outbound[]
  }

  export interface FastifyInstance {
    /** Main Decorator for Fastify **/
    hl7: HL7
  }
}
