import fastify, { FastifyInstance } from 'fastify'
import Server from "node-hl7-server";
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

    test('....properties & defaults check', async () => {
      await app.register(fastifyHL7)
      expect(app.hl7).toHaveProperty('buildMessage')
      expect(app.hl7).toHaveProperty('createOutbound')
      expect(app.hl7).toHaveProperty('createOutbound')
      expect(app.hl7).toHaveProperty('processMessage')
      expect(app.hl7._serverInstance instanceof Server).toBe(true)
      expect(app.hl7.inbound?.length).toBeUndefined()
      expect(app.hl7.outbound?.length).toBeUndefined()
    })

  })
})
