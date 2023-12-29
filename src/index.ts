import { FastifyInstance, HL7 } from 'fastify'
import fp from 'fastify-plugin'
import Server from 'node-hl7-server'
import { HL7Clients } from './class.js'
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
  const server = (typeof opts.enableServer !== 'undefined' && opts.enableServer) ? new Server(opts.serverOptions) : undefined

  // Client Functions
  const client = new HL7Clients()

  decorateFastifyInstance(
    fastify,
    opts, {
      createClient: function (name, props) {
        client.createClient(name, props)
      },
      createOutbound: function (name, props, handler) {
        return client.createOutbound(name, props, handler)
      },
      _serverInstance: server
    })
})

export default fastifyHL7
