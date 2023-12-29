import Server, { HL7Inbound, InboundHandler, ListenerOptions } from 'node-hl7-server'
import { AServers } from '../decorate'
import { errors } from '../errors'

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
