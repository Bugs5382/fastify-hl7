import fastify, { FastifyInstance } from 'fastify'
import Server from 'node-hl7-server'
import fastifyHL7 from '../src'
import { errors } from '../src/errors'

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
      expect(app.hl7).toHaveProperty('closeServer')
      expect(app.hl7).toHaveProperty('closeServerAll')
      expect(app.hl7).toHaveProperty('createClient')
      expect(app.hl7).toHaveProperty('createOutbound')
      expect(app.hl7).toHaveProperty('createOutbound')
      expect(app.hl7).toHaveProperty('processHL7')
      expect(app.hl7).toHaveProperty('readFile')
      expect(app.hl7).toHaveProperty('readFileBuffer')
      expect(app.hl7._serverInstance instanceof Server).toBe(true)
    })
  })

  describe('sanity checks', () => {
    test('....no double registration', async () => {
      try {
        await app.register(fastifyHL7)
        await app.register(fastifyHL7)
      } catch (err) {
        expect(err).toEqual(new errors.FASTIFY_HL7_ERR_SETUP_ERRORS('Already registered.'))
      }
    })

    describe('...no server', () => {
      beforeEach(async () => {
        await app.register(fastifyHL7, { enableServer: false })
      })

      test('...createInbound -- failure', async () => {
        try {
          app.hl7.createInbound({ port: 1234 }, async () => {})
        } catch (err) {
          expect(err).toEqual(new errors.FASTIFY_HL7_ERR_USAGE('server was not started. re-register plugin with enableServer set to true.'))
        }
      })

      test('...closeServer -- failure', async () => {
        try {
          await app.hl7.closeServer('1234')
        } catch (err) {
          expect(err).toEqual(new errors.FASTIFY_HL7_ERR_USAGE('server was not started. re-register plugin with enableServer set to true.'))
        }
      })

      test('...closeServerAll -- failure', async () => {
        try {
          await app.hl7.closeServerAll()
        } catch (err) {
          expect(err).toEqual(new errors.FASTIFY_HL7_ERR_USAGE('server was not started. re-register plugin with enableServer set to true.'))
        }
      })
    })

    test('...server started, close -- nothing there', async () => {
      try {
        await app.register(fastifyHL7)
        await app.hl7.closeServer('1234')
      } catch (err) {
        expect(err).toEqual(new  errors.FASTIFY_HL7_ERR_USAGE(`No inbound server listening on port: 1234`))
      }
    })

    describe('...no client', () => {
      beforeEach(async () => {
        await app.register(fastifyHL7)
      })

      test('...createClient - name invalid characters -- failure', async () => {
        try {
          app.hl7.createClient('hello/%323', { host: "dummy.local" })
        } catch (err) {
          expect(err).toEqual(new errors.FASTIFY_HL7_ERR_USAGE('name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};\':"\\\\|,.<>\\/?~.'))
        }
      })

      test('...createOutbound - name invalid characters -- failure', async () => {
        try {
          app.hl7.createOutbound('hello/%323', { port: 1234 }, async () => {})
        } catch (err) {
          expect(err).toEqual(new errors.FASTIFY_HL7_ERR_USAGE('name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};\':"\\\\|,.<>\\/?~.'))
        }
      })

      test('...createOutbound - none existing -- failure', async () => {
        try {
          app.hl7.createOutbound('hello', { port: 1234 }, async () => {})
        } catch (err) {
          expect(err).toEqual(new errors.FASTIFY_HL7_ERR_USAGE('No valid client. Improper setup of a outbound connection.'))
        }
      })

    })

    describe('...hl7', () => {

      // these should still work even without a server working
      beforeEach(async () => {
        await app.register(fastifyHL7, { enableServer: false })
      })

      test('...buildMessage -- with text', async () => {

        try {
          app.hl7.buildMessage({text: "MSH"})
        } catch (err) {
          expect(err).toEqual(new errors.FASTIFY_HL7_ERR_USAGE('Use processMessage method. This is for building.'))
        }

      })

    })

  })
})
