import Client, {
  ClientBuilderMessageOptions,
  ClientListenerOptions,
  ClientOptions,
  HL7Outbound,
  Message,
  OutboundHandler
} from 'node-hl7-client'
import { AClientPorts, AClients } from './decorate.js'
import { errors } from './errors.js'

export class HL7Clients {
  /** @internal */
  private readonly _clientConnections: AClients[]
  /** @internal */
  _clientPorts: AClientPorts[]

  constructor () {
    this._clientConnections = []
    this._clientPorts = []
  }

  /**
   *
   * @param name
   * @param props
   */
  createClient (name: string, props?: ClientOptions): void {
    const client = new Client(props)
    this._clientConnections.push({
      name,
      client
    })
  }

  /**
   *
   * @param name
   * @param props
   * @param handler
   */
  createOutbound (name: string, props: ClientListenerOptions, handler: OutboundHandler): HL7Outbound {
    const getConnection = this._clientConnections.find(client => client.name === name)
    if (typeof getConnection !== 'undefined') {
      // create outbound port to the server in getConnection.client
      const outbound = new HL7Outbound(getConnection.client, props, handler)
      // add it to the array of known ports. need to know this, so we can get it later if needed.
      this._clientPorts.push({
        [props.port.toString()]: outbound
      })
      // return it right away. the user might do something with it.
      return outbound
    }
    throw new errors.FASTIFY_HL7_ERR_USAGE('Improper setup of a outbound connection.')
  }

  /**
   * @since 1.0.0
   * @param text Raw HL& String
   */
  processMessage(text: string): Message {
    return new Message({text})
  }

  /**
   * @since 1.0.0
   * @param props
   */
  buildMessage(props: ClientBuilderMessageOptions): Message {
    if (typeof props.text !== 'undefined') {
      throw new errors.FASTIFY_HL7_ERR_USAGE('Use processMessage method. This is for building.')
    }
    return new Message({...props})
  }

}
