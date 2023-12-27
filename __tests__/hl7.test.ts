import fastify, { FastifyInstance } from 'fastify'
import fastifyHL7 from '../src'

let app: FastifyInstance

beforeEach(() => {
  app = fastify()
})

afterEach(async () => {
  await app.close()
})

describe('plugin fastify-hl7 tests', () => {
  describe('registration tests', () => {
    test('....successful', async () => {
      await app.register(fastifyHL7)
    })

    test('....successful - loglevel - debug', async () => {
      await app.register(fastifyHL7, {
        logLevel: 'debug'
      })
    })

    test('....successful - loglevel - trace', async () => {
      await app.register(fastifyHL7, {
        logLevel: 'trace'
      })
    })
  })

  describe('sanity checks', () => {
    test('ensure basic properties are accessible', async () => {
      await app.register(fastifyHL7)
      expect(app.hl7).toHaveProperty('CreateClient')
      expect(app.hl7).toHaveProperty('CreateServer')
    })
  })
})
