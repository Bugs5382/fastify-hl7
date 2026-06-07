/*
MIT License

Copyright (c) 2026 Shane Froebel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/
import Client, {
  Batch,
  ClientBuilderFileOptions,
  ClientBuilderMessageOptions,
  ClientBuilderOptions,
  ClientListenerOptions,
  ClientOptions,
  Connection,
  FileBatch,
  Message,
  OutboundHandler,
} from "node-hl7-client";
import Server, {
  Inbound,
  InboundHandler,
  ListenerOptions,
} from "node-hl7-server";

import { DateLength } from "./class/hL7Client.js";

declare module "fastify" {
  export interface FastifyInstance {
    /** Main Decorator for Fastify
     * @remarks hl7 is the decorator that everything hangs off.
     * @since 1.0.0 **/
    hl7: HL7;
  }

  export interface HL7 {
    /** Server Instance
     * @since 1.0.0 **/
    _serverInstance?: Server;
    /** Build HL7 Batch
     * @since 1.0.0 */
    buildBatch: (properties?: ClientBuilderOptions) => Batch;
    /** Build Date
     * @remarks Build a date string based off HL7 Standards
     * @param date
     * @param length Options are 8, 12, or 14 (default)
     * @since 2.1.0
     */
    buildDate: (date: Date, length?: DateLength) => string;
    /** Build HL7 File Batch
     * @since 1.0.0 */
    buildFileBatch: (properties?: ClientBuilderFileOptions) => FileBatch;
    /** Build HL7 Message
     * @since 1.0.0 */
    buildMessage: (properties?: ClientBuilderMessageOptions) => Message;
    /** Close a incoming HL7 port.
     * @since 1.0.0 */
    closeServer: (port: string) => Promise<boolean>;
    /** Close all incoming HL7 ports.
     * @since 1.0.0 */
    closeServerAll: () => Promise<boolean>;
    /** Create Client
     * @remarks Connecting to a remote server/broker that accepts connections.
     * @since 1.0.0 */
    createClient: (name: string, properties: ClientOptions) => Client;
    /** Create Outgoing Client Port
     * @remarks This is on the established client that we are already a part off.
     * @since 1.0.0 */
    createConnection: (
      name: string,
      properties: ClientListenerOptions,
      handler: OutboundHandler,
    ) => Connection;
    /** Create an incoming port connection on the server.
     * @since 1.0.0 */
    createInbound: (
      name: string,
      properties: ListenerOptions,
      handler: InboundHandler,
    ) => Inbound;
    /** Get Client (Outbound) connection by name.
     * @since 1.0.0 */
    getClientByName: (name: string) => Client | undefined;
    /** Get Client Connection (Outbound) connection by port.
     * @since 1.0.0 */
    getClientConnectionByPort: (port: string) => Connection | undefined;
    /** Get Server (Inbound) connection by name.
     * @since 1.0.0 */
    getServerByName: (name: string) => Inbound | undefined;
    /** Get Server (Inbound) connection by port.
     * @since 1.0.0 */
    getServerByPort: (port: string) => Inbound | undefined;
    /** Process an HL7 string.
     * @since 1.0.0  */
    processHL7: (text: string) => Batch | Message;
    /** Read a file from a path.
     * @since 1.0.0 */
    readFile: (fullFilePath: string) => FileBatch;
    /** Read a buffer that was a file batch.
     * @since 1.0.0 */
    readFileBuffer: (fileBuffer: Buffer) => FileBatch;
  }
}
