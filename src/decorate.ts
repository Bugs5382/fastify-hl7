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
import Client, { Connection } from "node-hl7-client";
import { Inbound, ServerOptions } from "node-hl7-server";

/**
 * @since 1.0.0
 */
export interface AClients {
  client: Client;
  name: string;
  ports: AClientPorts[];
}

/**
 * @since 1.0.0
 */
export interface AServers {
  name: string;
  port: string;
  server: Inbound;
}

/**
 * @since 1.0.0
 */
export interface FastifyHL7Options {
  /** Enable Server Instance for Inbound
   * @since 1.0.0
   * @default true */
  enableServer?: boolean;
  /** Override Server Options
   * @default From node-hl7-server */
  serverOptions?: ServerOptions;
}

/**
 * @since 1.0.0
 */
interface AClientPorts {
  connection: Connection;
  port: string;
}
