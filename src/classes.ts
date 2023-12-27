import Client, {
  Batch, ClientBuilderFileOptions,
  ClientBuilderMessageOptions,
  ClientBuilderOptions,
  ClientOptions,
  FileBatch,
  Message
} from 'node-hl7-client'
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

export class CreateBatch extends Batch {
  /**
   * @since 1.0.0
   * @param props
   */
  constructor (props?: ClientBuilderOptions) {
    super(props)
  }
}

export class CreateFileBatch extends FileBatch {
  /**
   * @since 1.0.0
   * @param props
   */
  constructor (props?: ClientBuilderFileOptions) {
    super(props)
  }
}

export class CreateMessage extends Message {
  /**
   * @since 1.0.0
   * @param props
   */
  constructor (props?: ClientBuilderMessageOptions) {
    super(props)
  }
}
