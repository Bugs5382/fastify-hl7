import fastify, { FastifyInstance } from 'fastify'
import portfinder from 'portfinder'
import tcpPortUsed from 'tcp-port-used'
import fastifyHL7 from '../src'
import {createDeferred, expectEvent, sleep} from './__utils__/utils'

let app: FastifyInstance

beforeEach(() => {
  app = fastify()
})

afterEach(async () => {
  await app.close()
})

describe('fastify-hl7 sample app tests', () => {
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

  test('...start server, connect with client - simple', async () => {
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

  test('...start server, connect with client - via route', async () => {
    await app.register(fastifyHL7)

    const dfd = createDeferred<void>() // eslint-disable-line

    app.get('/process/request', async function (_request, reply) {
      const hl7Object = new app.hl7.CreateMessage({
        messageHeader: {
          msh_9_1: 'ADT',
          msh_9_2: 'A01',
          msh_11_1: 'D'
        }
      })

      const client = new app.hl7.CreateClient({ host: '0.0.0.0' })
      const OB = client.createOutbound({ port: LISTEN_PORT }, async (resInbound) => {
        const messageRes = resInbound.getMessage()
        expect(messageRes.get('MSA.1').toString() === 'AA').toBe(true)
        dfd.resolve() // unit test done... continue
      })

      await OB.sendMessage(hl7Object)

      await OB.close()

      return await reply.send({result: true});
    })

    // server
    const server = new app.hl7.CreateServer()
    const IB = server.createInbound({ port: LISTEN_PORT }, async (_req, res) => {
      // if you are looking at this as an example, the _req object has the message being sent by the client
      await res.sendResponse('AA') // send a message that we are good.
    })

    await expectEvent(IB, 'listen')

    await sleep(5)

    const { body } = await app.inject({
      method: 'GET',
      url: '/process/request'
    })

    await dfd.promise

    const { result } = JSON.parse(body)

    expect(result).toBe(true)

    await IB.close()
  })
})
