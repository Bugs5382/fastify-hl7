import Client, { ClientOptions } from 'node-hl7-client'
import Server, { ServerOptions } from 'node-hl7-server'

export class CreateClient extends Client {
  /** @internal */
  private readonly _loaded: boolean = false

  /**
   * @since 1.0.0
   * @param props
   */
  constructor (props?: ClientOptions) {
    super(props)
    this._loaded = true
  }

  /**
   * Is Loaded?
   * @since 1.0.0
   */
  isLoaded (): boolean {
    return this._loaded
  }
}

export class CreateServer extends Server {
  /** @internal */
  private readonly _loaded: boolean = false

  /**
   * @since 1.0.0
   * @param props
   */
  constructor (props?: ServerOptions) {
    super(props)
    this._loaded = true
  }

  /**
   * Is Loaded?
   * @since 1.0.0
   */
  isLoaded (): boolean {
    return this._loaded
  }
}
