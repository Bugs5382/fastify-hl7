import Client, {
  Batch,
  ClientBuilderMessageOptions,
  ClientListenerOptions,
  ClientOptions, FileBatch,
  HL7Outbound, isBatch,
  Message,
  OutboundHandler
} from 'node-hl7-client'
import Server, { HL7Inbound, InboundHandler, ListenerOptions } from 'node-hl7-server'
import { AClients, AServers } from './decorate.js'
import { errors } from './errors.js'

export class HL7Server {
  private readonly _server: Server
  private readonly _serverInboundConnections: AServers[]

  constructor (server: Server) {
    this._server = server
    this._serverInboundConnections = []
  }

  /**
   * Close Inbound connection.
   * @since 1.0.0
   * @param port
   */
  async close (port: string): Promise<boolean> {
    const inbound = this._serverInboundConnections.find(server => server.port === port)
    if (typeof inbound !== 'undefined') {
      return await inbound.server.close() // close the server for all inbound connections
    }
    throw new errors.FASTIFY_HL7_ERR_USAGE(`No inbound server listening on port: ${port}`)
  }

  /**
   * Close all Inbound connections.
   * @since 1.0.0
   */
  async closeAll (): Promise<boolean> {
    this._serverInboundConnections.map(async inbound => {
      await inbound.server.close()
    })
    return true
  }

  /**
   * Create Inbound connection.
   * @since 1.0.0
   * @param props
   * @param handler
   */
  createInbound (props: ListenerOptions, handler: InboundHandler): HL7Inbound {
    const inbound = new HL7Inbound(this._server, props, handler)
    this._serverInboundConnections.push({
      port: props.port.toString(),
      server: inbound
    })
    return inbound
  }
}

export class HL7Client {
  /** @internal */
  private readonly _clientConnections: AClients[]

  constructor () {
    this._clientConnections = []
  }

  /**
   * Build a HL7 Message
   * @description Create a properly formatted HL7 message.
   * @since 1.0.0
   * @param props
   */
  buildMessage (props: ClientBuilderMessageOptions): Message {
    if (typeof props.text !== 'undefined') {
      throw new errors.FASTIFY_HL7_ERR_USAGE('Use processMessage method. This is for building.')
    }
    return new Message({ ...props })
  }

  /**
   *
   * @param name
   * @param props
   */
  createClient (name: string, props: ClientOptions | undefined): void {
    const nameFormat = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/ //eslint-disable-line
    if (nameFormat.test(name)) {
      throw new errors.FASTIFY_HL7_ERR_USAGE('name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};\':"\\\\|,.<>\\/?~.')
    }

    const client = new Client(props)

    this._clientConnections.push({
      name,
      client,
      ports: []
    })
  }

  /**
   * Create an HL7 Outbound Connection
   * @description Connect to an HL7 Server/Broker
   * @since 1.0.0
   * @param name The name stored within created client connections.
   * @param props
   * @param handler
   */
  createOutbound (name: string, props: ClientListenerOptions, handler: OutboundHandler): HL7Outbound {
    const nameFormat = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/ //eslint-disable-line
    if (nameFormat.test(name)) {
      throw new errors.FASTIFY_HL7_ERR_USAGE('name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};\':"\\\\|,.<>\\/?~.')
    }

    const getConnection = this._clientConnections.find(client => client.name === name)
    if (typeof getConnection !== 'undefined') {
      // create outbound port to the server in getConnection.client
      const outbound = new HL7Outbound(getConnection.client, props, handler)
      // add it to the array of known ports. need to know this, so we can get it later if needed.
      getConnection.ports.push({
        [props.port.toString()]: outbound
      })
      // return it right away. the user might do something with it.
      return outbound
    }

    throw new errors.FASTIFY_HL7_ERR_USAGE('Improper setup of a outbound connection.')
  }

  /**
   * Process a HL7
   * @description A HL7 message that could either be a Message (MSH) or Batch (BHS)
   * @since 1.0.0
   * @param text Raw HL& String
   */
  processHL7 (text: string): Message | Batch {
    if (isBatch(text)) {
      return new Batch({ text })
    } else {
      return new Message({ text })
    }
  }

  /**
   * Read File
   * @description Pass the correct path of the file you want to read.
   * @since 1.0.0
   * @param fullFilePath
   * @returns FileBatch
   * @example
   *
   * fastify.hl7.readFile( path.join('temp/', 'hl7.readTestBHS.20231208.hl7') )
   *
   */
  readFile (fullFilePath: string): FileBatch {
    return new FileBatch({ fullFilePath })
  }

  /**
   * Read a File Buffer
   * @description Translate an already Buffered HL7 FHS segment to decode it.
   * @since 1.0.0
   * @param fileBuffer
   * @returns FileBatch
   * @example
   *
   * const fileBuffer = fs.readFileSync(path.join('temp/', 'hl7.readTestBHS.20231208.hl7'))
   * fastify.hl7.readFileBuffer(fileBuffer)
   *
   */
  readFileBuffer (fileBuffer: Buffer): FileBatch {
    return new FileBatch({ fileBuffer })
  }
}
