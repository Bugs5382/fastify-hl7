import fastify, { FastifyInstance } from 'fastify'
import fs from "fs";
import {Batch, Message} from "node-hl7-client";
import path from "path";
import fastifyHL7 from '../src'

let app: FastifyInstance

beforeEach(() => {
  app = fastify()
})

afterEach(async () => {
  await app.close()
})

describe('fastify-hl7 sample app tests', () => {

  test('...build simple message', async() => {
    await app.register(fastifyHL7, {enableServer: false}) // server disabled for quickness
    const message = app.hl7.buildMessage({
      messageHeader: {
        msh_9_1: "ADT",
        msh_9_2: "A01",
        msh_11_1: "D",
      }
    })
    expect(message.toString()).toContain("ADT_A01")
  })

  test('...build batch message', async() => {
    const hl7Batch: string = 'BHS|^~\\&|||||20081231\rMSH|^~\\&|||||20081231||ADT^A01^ADT_A01|CONTROL_ID|D|2.7\rBTS|1'

    await app.register(fastifyHL7, {enableServer: false}) // server disabled for quickness

    const message = app.hl7.buildMessage({
      messageHeader: {
        msh_9_1: "ADT",
        msh_9_2: "A01",
        msh_10: "CONTROL_ID",
        msh_11_1: "D"
      }
    })
    message.set('MSH.7', '20081231')

    let batch = app.hl7.buildBatch()
    batch.set('BHS.7', '20081231')
    batch.add(message)
    batch.end()

    expect(batch.toString()).toEqual(hl7Batch)
  })

  test('...build file batch message', async() => {
    const hl7Batch: string = 'FHS|^~\\&|||||20081231\rBHS|^~\\&|||||20081231\rMSH|^~\\&|||||20081231||ADT^A01^ADT_A01|CONTROL_ID|D|2.7\rBTS|1\rFTS|1'

    await app.register(fastifyHL7, {enableServer: false}) // server disabled for quickness

    const message = app.hl7.buildMessage({
      messageHeader: {
        msh_9_1: "ADT",
        msh_9_2: "A01",
        msh_10: "CONTROL_ID",
        msh_11_1: "D"
      }
    })
    message.set('MSH.7', '20081231')

    let batch = app.hl7.buildBatch()
    batch.set('BHS.7', '20081231')
    batch.add(message)
    batch.end()

    let fileBatch = app.hl7.buildFileBatch()
    fileBatch.set('FHS.7', '20081231')
    fileBatch.add(batch)
    fileBatch.end()

    expect(fileBatch.toString()).toEqual(hl7Batch)
  })

  describe('...parse', () => {
    test('...parse a hl7 (MSH)', async () => {
      const hl7String: string = 'MSH|^~\\&|||||20081231||ADT^A01^ADT_A01|12345||2.7\rEVN||20081231'
      await app.register(fastifyHL7, {enableServer: false}) // server disabled for quickness
      const message = app.hl7.processHL7(hl7String)
      expect(message instanceof Message).toBe(true)
    })

    test('...parse a hl7 (BHS)', async () => {
      const hl7Batch: string = 'BHS|^~\\&|||||20231208\rMSH|^~\\&|||||20231208||ADT^A01^ADT_A01|CONTROL_ID||2.7\rEVN||20081231\rEVN||20081231\rBTS|1'
      await app.register(fastifyHL7, {enableServer: false}) // server disabled for quickness
      const message = app.hl7.processHL7(hl7Batch)
      expect(message instanceof Batch).toBe(true)
    })

    test('...parse a file (raw)', async () => {

      await app.register(fastifyHL7, {enableServer: false}) // server disabled for quickness
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

      await app.register(fastifyHL7, {enableServer: false}) // server disabled for quickness
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

    test.todo('...createInbound')

    test.todo('...closeServer')

    test.todo('...closeServerAll')

  })

})
