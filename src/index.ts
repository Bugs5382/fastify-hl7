import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { CreateClient, CreateServer } from './classes.js'
import { FastifyHL7Options } from './decorate.js'
import { errors } from './errors.js'
export * from './types.js'

const decorateFastifyInstance = (fastify: FastifyInstance, _options: FastifyHL7Options, connection: any): void => {
  if (typeof fastify.hl7 !== 'undefined') {
    throw new errors.FASTIFY_HL7_ERR_SETUP_ERRORS('Already registered.')
  }

  if (typeof fastify.hl7 === 'undefined') {
    fastify.log.trace('[fastify-hl7] Decorate Fastify')
    fastify.decorate('hl7', connection)
  }
}

const fastifyHL7 = fp<FastifyHL7Options>(async (fastify, opts) => {
  decorateFastifyInstance(
    fastify,
    opts,
    {
      CreateClient,
      CreateServer
    })
})

export default fastifyHL7
