import { FastifyInstance, HL7 } from 'fastify'
import fp from 'fastify-plugin'
import { Batch, ClientBuilderMessageOptions, FileBatch, Message } from 'node-hl7-client'
import Server, { HL7Inbound, InboundHandler, ListenerOptions } from 'node-hl7-server'
import { HL7Client, HL7Server } from './class.js'
import { FastifyHL7Options } from './decorate.js'
import { errors } from './errors.js'
import { validateOpts } from './validation.js'
export * from './types.js'

/**
 * @since 1.0.0
 * @param fastify
 * @param _opts
 * @param connection
 */
const decorateFastifyInstance = (fastify: FastifyInstance, _opts: FastifyHL7Options, connection: HL7): void => {
  if (typeof fastify.hl7 !== 'undefined') {
    throw new errors.FASTIFY_HL7_ERR_SETUP_ERRORS('Already registered.')
  }

  if (typeof fastify.hl7 === 'undefined') {
    fastify.log.trace('[fastify-hl7] Decorate Fastify')
    fastify.decorate('hl7', connection)
  }
}

const fastifyHL7 = fp<FastifyHL7Options>(async (fastify, opts) => {
  const generatedOpts = await validateOpts(opts)
  opts = { ...opts, ...generatedOpts }

  // Create server.
  // Since there can only be one server per IP address
  // (i.e., the host this is running on.) There can only be more than one.
  // A server can host many HL7 Inbound connections via different ports, this is fine.
  // Clients are different as a app could talk to different servers, on many ports.
  // So we need to do something different.
  const serverInstance = (typeof opts.enableServer !== 'undefined' && opts.enableServer) ? new Server(opts.serverOptions) : undefined

  // Server Functions
  let server: HL7Server | undefined
  if (typeof serverInstance !== 'undefined') {
    // Server Functions
    server = new HL7Server(serverInstance)
  }

  // Client Functions
  const client = new HL7Client()

  decorateFastifyInstance(
    fastify,
    opts, {
      _serverInstance: serverInstance,
      buildMessage: function (props: ClientBuilderMessageOptions): Message {
        return client.buildMessage(props)
      },
      createClient: function (name, props) {
        client.createClient(name, props)
      },
      createInbound: function (props: ListenerOptions, handler: InboundHandler): HL7Inbound {
        if (typeof server !== 'undefined') {
          return server.createInbound(props, handler)
        }
        throw new errors.FASTIFY_HL7_ERR_USAGE('server was not started. re-register plugin with enableServer set to true.')
      },
      createOutbound: function (name, props, handler) {
        return client.createOutbound(name, props, handler)
      },
      processHL7: function (text: string): Message | Batch {
        return client.processHL7(text)
      },
      readFile: function (fullFilePath: string): FileBatch {
        return client.readFile(fullFilePath)
      },
      readFileBuffer: function (fileBuffer: Buffer): FileBatch {
        return client.readFileBuffer(fileBuffer)
      }
    })
})

export default fastifyHL7
