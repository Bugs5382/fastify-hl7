import fastify, { FastifyInstance } from 'fastify'
import {Batch, Message} from "node-hl7-client";
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
    await app.register(fastifyHL7)
    const message = app.hl7.buildMessage({
      messageHeader: {
        msh_9_1: "ADT",
        msh_9_2: "A01",
        msh_11_1: "D",
      }
    })
    expect(message.toString()).toContain("ADT_A01")
  })

  test('...parse a hl7 (MSH)', async () => {
    const hl7String: string = 'MSH|^~\\&|||||20081231||ADT^A01^ADT_A01|12345||2.7\rEVN||20081231'
    await app.register(fastifyHL7)
    const message = app.hl7.processHL7(hl7String)
    expect(message instanceof Message).toBe(true)
  })

  test('...parse a hl7 (BHS)', async () => {
    const hl7Batch: string = 'BHS|^~\\&|||||20231208\rMSH|^~\\&|||||20231208||ADT^A01^ADT_A01|CONTROL_ID||2.7\rEVN||20081231\rEVN||20081231\rBTS|1'
    await app.register(fastifyHL7)
    const message = app.hl7.processHL7(hl7Batch)
    expect(message instanceof Batch).toBe(true)
  })

  describe('...server', () => {

    test.todo('...createInbound')

    test.todo('...closeServer')

    test.todo('...closeServerAll')

  })

})
