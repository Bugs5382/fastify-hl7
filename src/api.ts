import { HL7 } from "fastify";
import fastifyHL7 from ".";
import { HL7Clients } from "./class.js";
import {AHL7Inbound, AHL7Outbound, FastifyHL7Options } from "./decorate.js";

export default fastifyHL7
export { fastifyHL7, HL7, FastifyHL7Options, HL7Clients, AHL7Inbound, AHL7Outbound }