import { HL7 } from 'fastify'
import fastifyHL7 from '.'

import { FastifyHL7Options } from './decorate.js'
import { HL7Client } from './class/hL7Client.js'
import { HL7Server } from './class/hL7Server.js'

export default fastifyHL7
export { fastifyHL7, HL7, FastifyHL7Options, HL7Client, HL7Server }
