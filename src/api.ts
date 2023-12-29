import { HL7 } from 'fastify'
import fastifyHL7 from '.'
import { HL7Client } from './class.js'
import { FastifyHL7Options } from './decorate.js'

export default fastifyHL7
export { fastifyHL7, HL7, FastifyHL7Options, HL7Client }
