
import fastify, { FastifyInstance } from 'fastify'
import portfinder from 'portfinder'
import tcpPortUsed from 'tcp-port-used'
import fastifyHL7 from '../src'
import { expectEvent } from './__utils__/utils'

let app: FastifyInstance

beforeEach(() => {
  app = fastify()
})

afterEach(async () => {
  await app.close()
})

describe('fastify-hl7 sample app tests', () => {
  describe('no namespace', () => {
    let LISTEN_PORT: number

    beforeEach(async () => {
      LISTEN_PORT = await portfinder.getPortPromise({
        port: 3000,
        stopPort: 65353
      })
    })

    test('...start server', async () => {
      await app.register(fastifyHL7)

      const server = new app.hl7.CreateServer()

      const IB = server.createInbound({ port: LISTEN_PORT }, async () => {})

      await expectEvent(IB, 'listen')

      const usedCheck = await tcpPortUsed.check(LISTEN_PORT, '0.0.0.0')

      expect(usedCheck).toBe(true)

      await IB.close()
    })

    test('...start server, connect with client', async () => {
      await app.register(fastifyHL7)

      const server = new app.hl7.CreateServer()

      const IB = server.createInbound({ port: LISTEN_PORT }, async () => {})

      await expectEvent(IB, 'listen')

      const usedCheck = await tcpPortUsed.check(LISTEN_PORT, '0.0.0.0')

      expect(usedCheck).toBe(true)

      const client = new app.hl7.CreateClient({ host: '0.0.0.0' })

      const OB = client.createOutbound({ port: LISTEN_PORT }, async () => {})

      await expectEvent(OB, 'connect')

      await OB.close()
      await IB.close()
    })
  })
})
