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
      console.log(app.hl7)
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
})
