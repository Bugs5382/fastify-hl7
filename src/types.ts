import { HL7Classes } from 'fastify'
import Client, { ClientOptions } from 'node-hl7-client'
import Server, { ServerOptions } from 'node-hl7-server'

declare module 'fastify' {

  interface HL7Classes {
    /** Client Class
     * @since 1.0.0 */
    CreateClient: new (props?: ClientOptions) => Client
    /** Server Class
     * @since 1.0.0 */
    CreateServer: new (props?: ServerOptions) => Server
  }

  export interface FastifyInstance {
    /** Main Decorator for Fastify **/
    hl7: HL7Classes & fastifyHL7.fastifyHL7NO
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace fastifyHL7 {
  export interface fastifyHL7NO {
    [namespace: string]: HL7Classes
  }
}
