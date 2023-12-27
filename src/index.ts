import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { CreateClient, CreateServer } from './classes.js'
import { FastifyHL7Options } from './decorate.js'
import { errors } from './errors.js'
import { validateOpts } from './validation.js'
export * from './types.js'

const decorateFastifyInstance = (fastify: FastifyInstance, options: FastifyHL7Options, connection: any): void => {
  const {
    namespace = ''
  } = options

  if (typeof namespace !== 'undefined') {
    fastify.log.debug('[fastify-hl7] Namespace: %s', namespace)
  }

  // if (typeof namespace !== 'undefined' && namespace !== '') {
  //   if (typeof fastify.hl7 === 'undefined') {
  //     fastify.decorate('hl7', Object.create(null))
  //   }
  //
  //   if (typeof fastify.hl7[namespace] !== 'undefined') {
  //     throw new errors.FASTIFY_HL7_ERR_SETUP_ERRORS(`Already registered with namespace: ${namespace}`)
  //   }
  //
  //   fastify.log.trace('[fastify-rabbitmq] Decorate Fastify with Namespace: %', namespace)
  //   fastify.hl7[namespace] = connection
  // } else {
  //   if (typeof fastify.hl7 !== 'undefined') {
  //     throw new errors.FASTIFY_HL7_ERR_SETUP_ERRORS('Already registered.')
  //   }
  // }

  if (typeof fastify.hl7 !== 'undefined') {
    throw new errors.FASTIFY_HL7_ERR_SETUP_ERRORS('Already registered.')
  }

  if (typeof fastify.hl7 === 'undefined') {
    fastify.log.trace('[fastify-hl7] Decorate Fastify')
    fastify.decorate('hl7', connection)
  }
}

const fastifyHL7 = fp<FastifyHL7Options>(async (fastify, opts) => {
  await validateOpts(opts)

  decorateFastifyInstance(
    fastify,
    opts,
    {
      CreateClient,
      CreateServer
    })
})

export default fastifyHL7
