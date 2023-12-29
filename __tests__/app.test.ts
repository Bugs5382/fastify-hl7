import fastify, { FastifyInstance } from 'fastify'
import fastifyHL7 from '../src'

let app: FastifyInstance

beforeEach(() => {
  app = fastify()
})

afterEach(async () => {
  await app.close()
})

describe('fastify-hl7 sample app tests', () => {
  test.skip('...start server', async () => {
    await app.register(fastifyHL7)
  })
})
