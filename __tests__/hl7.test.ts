import fastify, {FastifyInstance} from 'fastify'

let app: FastifyInstance

beforeEach(() => {
  app = fastify()
})

afterEach(async () => {
  await app.close()
})

describe('plugin fastify-hl7 tests', () => {

  describe('registration tests', () => {

    test.todo('....placeholder')

  })

  describe('sanity checks', () => {

    test.todo('....placeholder')

  })

  describe('common action tests', () => {

    test.todo('....placeholder')

  })

})