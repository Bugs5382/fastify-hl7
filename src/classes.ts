import Client, { ClientOptions } from 'node-hl7-client'
import Server, { ServerOptions } from 'node-hl7-server'

export class CreateClient extends Client {
  /**
   * @since 1.0.0
   * @param props
   */
  constructor (props?: ClientOptions) {
    super(props)
  }
}

export class CreateServer extends Server {
  /**
   * @since 1.0.0
   * @param props
   */
  constructor (props?: ServerOptions) {
    super(props)
  }
}
