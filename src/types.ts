import { HL7Classes } from 'fastify'
import Client, {
  Batch,
  ClientBuilderFileOptions,
  ClientBuilderMessageOptions,
  ClientBuilderOptions,
  ClientOptions, FileBatch,
  Message
} from 'node-hl7-client'
import Server, { ServerOptions } from 'node-hl7-server'

declare module 'fastify' {

  interface HL7Classes {
    /** Batch Class
     * @since 1.0.0
     * @param props
     * @constructor
     */
    CreateBatch: new (props?: ClientBuilderOptions) => Batch
    /** Client Class
     * @since 1.0.0
     * @param props
     * @constructor
     */
    CreateClient: new (props?: ClientOptions) => Client
    /** File Batch Class
     * @since 1.0.0
     * @param props
     * @constructor
     */
    CreateFileBatch: new (props?: ClientBuilderFileOptions) => FileBatch
    /** Message Class
     * @since 1.0.0
     * @param props
     * @constructor
     */
    CreateMessage: new (props?: ClientBuilderMessageOptions) => Message
    /** Server Class
     * @since 1.0.0
     * @param props
     * @constructor
     */
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
