import { HL7Functions } from 'fastify'
import { Batch, Client, FileBatch, Message } from 'node-hl7-client'
import { Server } from 'node-hl7-server'

declare module 'fastify' {

  interface HL7Functions {
    /** Builder
     * @since 1.0.0 */
    builder: {
      /** Batch Instance
       * @since 1.0.0 */
      batch: Batch
      /** File Batch Instance
       * @since 1.0.0 */
      fileBatch: FileBatch
      /** Message Instance
       * @since 1.0.0 */
      message: Message
    }
    /** Client Class
     * @since 1.0.0 */
    client: Client
    /** Server Class
     * @since 1.0.0 */
    server: Server
  }

  export interface FastifyInstance {
    /** Main Decorator for Fastify **/
    hl7: HL7Functions
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace fastifyHL7 {
  export interface fastifyHL7NO {
    [namespace: string]: HL7Functions
  }
}
