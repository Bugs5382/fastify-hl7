import fastify, { FastifyInstance } from 'fastify'
import fs from 'fs'
import { Batch, Message } from 'node-hl7-client'
import path from 'path'
import tcpPortUsed from 'tcp-port-used'
import { describe, expect, test, beforeEach, afterEach } from 'vitest'
import fastifyHL7 from '../src'
import { errors } from '../src/errors'
import { createDeferred, expectEvent, sleep } from './__utils__/utils'

let app: FastifyInstance

beforeEach(() => {
  app = fastify()
})

afterEach(async () => {
  await app.close()
})

describe('fastify-hl7 sample app tests', () => {
  test('...build simple message', async () => {
    await app.register(fastifyHL7, { enableServer: false }) // server disabled for quickness
    const message = app.hl7.buildMessage({
      messageHeader: {
        msh_9_1: 'ADT',
        msh_9_2: 'A01',
        msh_11_1: 'D'
      }
    })
    expect(message.toString()).toContain('ADT_A01')
  })

  test('...build batch message', async () => {
    const hl7Batch: string = 'BHS|^~\\&|||||20081231\rMSH|^~\\&|||||20081231||ADT^A01^ADT_A01|CONTROL_ID|D|2.7\rBTS|1'

    await app.register(fastifyHL7, { enableServer: false }) // server disabled for quickness

    const message = app.hl7.buildMessage({
      messageHeader: {
        msh_9_1: 'ADT',
        msh_9_2: 'A01',
        msh_10: 'CONTROL_ID',
        msh_11_1: 'D'
      }
    })
    message.set('MSH.7', '20081231')

    const batch = app.hl7.buildBatch()
    batch.set('BHS.7', '20081231')
    batch.add(message)
    batch.end()

    expect(batch.toString()).toEqual(hl7Batch)
  })

  test('...build file batch message', async () => {
    const hl7Batch: string = 'FHS|^~\\&|||||20081231\rBHS|^~\\&|||||20081231\rMSH|^~\\&|||||20081231||ADT^A01^ADT_A01|CONTROL_ID|D|2.7\rBTS|1\rFTS|1'

    await app.register(fastifyHL7, { enableServer: false }) // server disabled for quickness

    const message = app.hl7.buildMessage({
      messageHeader: {
        msh_9_1: 'ADT',
        msh_9_2: 'A01',
        msh_10: 'CONTROL_ID',
        msh_11_1: 'D'
      }
    })
    message.set('MSH.7', '20081231')

    const batch = app.hl7.buildBatch()
    batch.set('BHS.7', '20081231')
    batch.add(message)
    batch.end()

    const fileBatch = app.hl7.buildFileBatch()
    fileBatch.set('FHS.7', '20081231')
    fileBatch.add(batch)
    fileBatch.end()

    expect(fileBatch.toString()).toEqual(hl7Batch)
  })

  describe('...parse', () => {
    test('...parse a hl7 (MSH)', async () => {
      const hl7String: string = 'MSH|^~\\&|||||20081231||ADT^A01^ADT_A01|12345||2.7\rEVN||20081231'
      await app.register(fastifyHL7, { enableServer: false }) // server disabled for quickness
      const message = app.hl7.processHL7(hl7String)
      expect(message instanceof Message).toBe(true)
    })

    test('...parse a hl7 (BHS)', async () => {
      const hl7Batch: string = 'BHS|^~\\&|||||20231208\rMSH|^~\\&|||||20231208||ADT^A01^ADT_A01|CONTROL_ID||2.7\rEVN||20081231\rEVN||20081231\rBTS|1'
      await app.register(fastifyHL7, { enableServer: false }) // server disabled for quickness
      const message = app.hl7.processHL7(hl7Batch)
      expect(message instanceof Batch).toBe(true)
    })

    test('...parse a file (raw)', async () => {
      await app.register(fastifyHL7, { enableServer: false }) // server disabled for quickness
      const fileBatch = app.hl7.readFile(path.join('__tests__/__hl7__/', 'hl7.readFileTestMSH.20081231.hl7'))

      const messages = fileBatch.messages()
      expect(messages.length).toBe(1)

      messages.forEach((message: Message): void => {
        let count: number = 0
        message.get('EVN').forEach((segment): void => {
          expect(segment.name).toBe('EVN')
          count++
        })
        expect(count).toBe(1)
      })
    })

    test('...parse a file (buffer)', async () => {
      await app.register(fastifyHL7, { enableServer: false }) // server disabled for quickness
      const fileBatch = app.hl7.readFileBuffer(fs.readFileSync(path.join('__tests__/__hl7__/', 'hl7.readFileTestMSH.20081231.hl7')))

      const messages = fileBatch.messages()
      expect(messages.length).toBe(1)

      messages.forEach((message: Message): void => {
        let count: number = 0
        message.get('EVN').forEach((segment): void => {
          expect(segment.name).toBe('EVN')
          count++
        })
        expect(count).toBe(1)
      })
    })
  })

  describe('...server', () => {
    test('...createInbound', async () => {
      await app.register(fastifyHL7)

      const listener = app.hl7.createInbound('adt', { port: 3001 }, async () => {})

      await expectEvent(listener, 'listen')

      const usedCheck = await tcpPortUsed.check(3001, '0.0.0.0')

      expect(usedCheck).toBe(true)
    })

    test('...closeServer', async () => {
      await app.register(fastifyHL7)

      const listener = app.hl7.createInbound('adt', { port: 3001 }, async () => {})

      await expectEvent(listener, 'listen')

      await app.hl7.closeServer('3001')

      const usedCheck = await tcpPortUsed.check(3001, '0.0.0.0')

      expect(usedCheck).toBe(false)
    })

    test('...closeServerAll', async () => {
      await app.register(fastifyHL7)

      const listener = app.hl7.createInbound('adt', { port: 3001 }, async () => {})

      await expectEvent(listener, 'listen')

      expect(await tcpPortUsed.check(3001, '0.0.0.0')).toBe(true)

      await app.hl7.closeServerAll()

      expect(await tcpPortUsed.check(3001, '0.0.0.0')).toBe(false)
    })

    test('...getClientByName and getServerByPort', async () => {
      await app.register(fastifyHL7)

      const listener = app.hl7.createInbound('adt', { port: 3001 }, async () => {})

      await expectEvent(listener, 'listen')

      const listenerPullPort = app.hl7.getServerByPort('3001')
      const listenerPullName = app.hl7.getServerByName('adt')

      expect(listenerPullPort).toEqual(listener)
      expect(listenerPullName).toEqual(listener)
    })
  })

  describe('...end to end', () => {
    test('...no double createConnection to the same port', async () => {
      const appServer = fastify()

      await appServer.register(fastifyHL7)
      await app.register(fastifyHL7)

      appServer.hl7.createInbound('adt', { port: 3002 }, async () => {})
      const client = app.hl7.createClient('localhost2', { host: '0.0.0.0' })

      try {
        app.hl7.createConnection('localhost2', { port: 3002 }, async () => {})
        app.hl7.createConnection('localhost2', { port: 3002 }, async () => {})
      } catch (err) {
        expect(err).toEqual(new errors.FASTIFY_HL7_ERR_USAGE('port 3002 is already used with this client. Choose a new outgoing port.'))
      }

      await client.closeAll()

      await appServer.close()
    })

    test('...full test', async () => {
      const appServer = fastify()

      await appServer.register(fastifyHL7)
      await app.register(fastifyHL7)

      const dfd = createDeferred<void>() // eslint-disable-line @typescript-eslint/no-invalid-void-type

      const listener = appServer.hl7.createInbound(
        'adt',
        { port: 3001 },
        async (req, res) => {
          const messageReq = req.getMessage()
          const messageType = req.getType()
          expect(messageType).toBe('file')
          expect(messageReq.get('MSH.12').toString()).toBe('2.7')
          await res.sendResponse('AA')
        })

      await expectEvent(listener, 'listen')

      const usedCheck = await tcpPortUsed.check(3001, '0.0.0.0')
      expect(usedCheck).toBe(true)

      await sleep(10)

      app.hl7.createClient('localhost', { host: '0.0.0.0' })

      const client = app.hl7.createConnection(
        'localhost',
        { port: 3001 },
        async (res) => {
          const messageRes = res.getMessage()
          expect(messageRes.get('MSA.1').toString()).toBe('AA')
          dfd.resolve()
        })

      await expectEvent(client, 'ready')

      const message = app.hl7.buildMessage({
        messageHeader: {
          msh_9_1: 'ADT',
          msh_9_2: 'A01',
          msh_11_1: 'D'
        }
      })

      await client.sendMessage(message)

      await dfd.promise

      await client.close()

      await appServer.close()
    })

    test('...full test, inside routes', async () => {
      const dfd = createDeferred<void>() // eslint-disable-line @typescript-eslint/no-invalid-void-type

      // Setup remote side
      const appServer = fastify()
      await appServer.register(fastifyHL7)
      appServer.hl7.createInbound(
        'adt',
        { port: 3001 },
        async (req, res) => {
          const messageReq = req.getMessage()
          const messageType = req.getType()
          expect(messageType).toBe('file')
          expect(messageReq.get('MSH.12').toString()).toBe('2.7')
          await res.sendResponse('AA')
        }
      )

      // setup app, and then setup a client as if it's in a plugin
      await app.register(fastifyHL7, { enableServer: false })
      app.hl7.createClient('localhost', { host: '0.0.0.0' })
      const connection = app.hl7.createConnection(
        'localhost',
        { port: 3001 },
        async (res) => {
          const messageRes = res.getMessage()
          expect(messageRes.get('MSA.1').toString()).toBe('AA')
          dfd.resolve()
        }
      )

      app.route({
        method: 'GET',
        url: '/',
        handler: async function (_request, reply) {
          // find the connection
          const getOutbound = app.hl7.getClientConnectionByPort('3001')

          const message = app.hl7.buildMessage({
            messageHeader: {
              msh_9_1: 'ADT',
              msh_9_2: 'A01',
              msh_11_1: 'D'
            }
          })

          // lets send the message
          await getOutbound?.sendMessage(message)

          await reply.send({ hello: 'world' })
        }
      })

      await app.inject({
        method: 'GET',
        path: '/'
      })

      await dfd.promise

      await connection.close()

      await appServer.close()
    })
  })
})
