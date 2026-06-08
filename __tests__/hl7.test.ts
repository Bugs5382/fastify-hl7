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
import fastify, { FastifyInstance } from "fastify";
import Server from "node-hl7-server";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import fastifyHL7 from "../src";
import { errors } from "../src/errors";
import { getCurrentDateYYYYMMDD } from "./__utils__/utils.js";

let app: FastifyInstance;

beforeEach(() => {
  app = fastify();
});

afterEach(async () => {
  await app.close();
});

describe("plugin fastify-hl7 tests", () => {
  describe("registration tests", () => {
    test("....successful", async () => {
      await app.register(fastifyHL7);
    });

    test("....successful - loglevel - debug", async () => {
      await app.register(fastifyHL7, {
        logLevel: "debug",
      });
    });

    test("....successful - loglevel - trace", async () => {
      await app.register(fastifyHL7, {
        logLevel: "trace",
      });
    });

    test("....properties & defaults check", async () => {
      await app.register(fastifyHL7);
      expect(app.hl7).toHaveProperty("buildMessage");
      expect(app.hl7).toHaveProperty("closeServer");
      expect(app.hl7).toHaveProperty("closeServerAll");
      expect(app.hl7).toHaveProperty("createClient");
      expect(app.hl7).toHaveProperty("createConnection");
      expect(app.hl7).toHaveProperty("processHL7");
      expect(app.hl7).toHaveProperty("readFile");
      expect(app.hl7).toHaveProperty("readFileBuffer");
      expect(app.hl7._serverInstance instanceof Server).toBe(true);
    });
  });

  describe("sanity checks", () => {
    test("....no double registration", async () => {
      try {
        await app.register(fastifyHL7);
        await app.register(fastifyHL7);
      } catch (error) {
        expect(error).toEqual(
          new errors.FASTIFY_HL7_ERR_SETUP_ERRORS("Already registered."),
        );
      }
    });

    test("...createInbound -- name -- failure", async () => {
      await app.register(fastifyHL7);
      try {
        app.hl7.createInbound("adt/23*4&", { port: 1234 }, async () => {});
      } catch (error) {
        expect(error).toEqual(
          new errors.FASTIFY_HL7_ERR_USAGE(
            "name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~.",
          ),
        );
      }
    });

    describe("...no server", () => {
      beforeEach(async () => {
        await app.register(fastifyHL7, { enableServer: false });
      });

      test("...createInbound -- failure", async () => {
        try {
          app.hl7.createInbound("adt", { port: 1234 }, async () => {});
        } catch (error) {
          expect(error).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "server was not started. re-register plugin with enableServer set to true.",
            ),
          );
        }
      });

      test("...closeServer -- failure", async () => {
        try {
          await app.hl7.closeServer("1234");
        } catch (error) {
          expect(error).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "server was not started. re-register plugin with enableServer set to true.",
            ),
          );
        }
      });

      test("...closeServerAll -- failure", async () => {
        try {
          await app.hl7.closeServerAll();
        } catch (error) {
          expect(error).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "server was not started. re-register plugin with enableServer set to true.",
            ),
          );
        }
      });

      test("...getServerByName -- failure", async () => {
        try {
          await app.hl7.getServerByName("test");
        } catch (error) {
          expect(error).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "server was not started. re-register plugin with enableServer set to true.",
            ),
          );
        }
      });

      test("...getServerByPort -- failure", async () => {
        try {
          await app.hl7.getServerByPort("1234");
        } catch (error) {
          expect(error).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "server was not started. re-register plugin with enableServer set to true.",
            ),
          );
        }
      });
    });

    test("...server started, close -- nothing there", async () => {
      try {
        await app.register(fastifyHL7);
        await app.hl7.closeServer("1234");
      } catch (error) {
        expect(error).toEqual(
          new errors.FASTIFY_HL7_ERR_USAGE(
            "No inbound server listening on port: 1234",
          ),
        );
      }
    });

    test("...server started, getServerByName undefined ", async () => {
      await app.register(fastifyHL7);
      const server = await app.hl7.getServerByName("adt");
      expect(server).toBeUndefined();
    });

    test("...server started, getServerByPort undefined ", async () => {
      await app.register(fastifyHL7);
      const server = await app.hl7.getServerByPort("1234");
      expect(server).toBeUndefined();
    });

    describe("...no client", () => {
      beforeEach(async () => {
        await app.register(fastifyHL7);
      });

      test("...createClient - name invalid characters -- failure", async () => {
        try {
          app.hl7.createClient("hello/%323", { host: "dummy.local" });
        } catch (error) {
          expect(error).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~.",
            ),
          );
        }
      });

      test("...createClient - name already used -- failure", async () => {
        try {
          app.hl7.createClient("hello", {
            host: "dummy.local",
            version: "2.7",
          });
          app.hl7.createClient("hello", {
            host: "dummy.local",
            version: "2.7",
          });
        } catch (error) {
          expect(error).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE("name must be unique."),
          );
        }
      });

      test("...createConnection - name invalid characters -- failure", async () => {
        try {
          app.hl7.createConnection(
            "hello/%323",
            { port: 1234 },
            async () => {},
          );
        } catch (error) {
          expect(error).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~.",
            ),
          );
        }
      });

      test("...createConnection - none existing -- failure", async () => {
        try {
          app.hl7.createConnection("hello", { port: 1234 }, async () => {});
        } catch (error) {
          expect(error).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "No valid client. Improper setup of a outbound connection.",
            ),
          );
        }
      });
    });

    describe("...client", () => {
      beforeEach(async () => {
        await app.register(fastifyHL7);
      });

      test("...getClientByName -- nothing set", async () => {
        const clientPullName = app.hl7.getClientByName("adt");
        expect(clientPullName).toBeUndefined();
      });

      test("...getClientByName", async () => {
        const client = app.hl7.createClient("adt", {
          host: "0.0.0.0",
          version: "2.7",
        });
        const clientPullName = app.hl7.getClientByName("adt");
        expect(clientPullName).toEqual(client);
      });

      test("...buildDate", async () => {
        expect(app.hl7.buildDate(new Date(), "8")).toEqual(
          getCurrentDateYYYYMMDD(),
        );
      });
    });

    describe("...hl7", () => {
      // these should still work even without a server working
      beforeEach(async () => {
        await app.register(fastifyHL7, { enableServer: false });
      });

      test("...buildFileBatch -- fullFilePath not allowed", async () => {
        try {
          app.hl7.buildFileBatch({
            fullFilePath: path.join(
              "__tests__/__hl7__/",
              "hl7.readFileTestMSH.20081231.hl7",
            ),
          });
        } catch (error) {
          expect(error).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "Use readFile or readFileBuffer method. This is for building.",
            ),
          );
        }
      });

      test("...buildFileBatch -- fileBuffer not allowed", async () => {
        try {
          app.hl7.buildFileBatch({
            fileBuffer: fs.readFileSync(
              path.join(
                "__tests__/__hl7__/",
                "hl7.readFileTestMSH.20081231.hl7",
              ),
            ),
          });
        } catch (error) {
          expect(error).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "Use readFile or readFileBuffer method. This is for building.",
            ),
          );
        }
      });

      test("...buildBatch -- must be a message type", async () => {
        try {
          app.hl7.buildBatch({ text: "BHS" });
        } catch (error) {
          expect(error).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "Use processMessage method. This is for building.",
            ),
          );
        }
      });

      test("...buildMessage -- with text", async () => {
        try {
          app.hl7.buildMessage({ text: "MSH" });
        } catch (error) {
          expect(error).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "Use processMessage method. This is for building.",
            ),
          );
        }
      });
    });

    describe("...createBuilder (verified build)", () => {
      beforeEach(async () => {
        await app.register(fastifyHL7, { enableServer: false });
      });

      test("...is exposed on the decorator", async () => {
        expect(app.hl7).toHaveProperty("createBuilder");
      });

      test("...builds a version-pinned message", async () => {
        const message = app.hl7
          .createBuilder("2.7")
          .buildMSH({
            msh_10: "MSG00001",
            msh_11_1: "P",
            msh_3: "MY_APP",
            msh_4: "MY_FAC",
            msh_5: "EPIC",
            msh_6: "HOSP",
            msh_9_1: "ADT",
            msh_9_2: "A01",
          })
          .toMessage();
        const raw = message.toString();
        expect(raw).toContain("ADT");
        expect(raw).toContain("2.7");
      });

      test("...pins the requested version into MSH.12", async () => {
        const message = app.hl7
          .createBuilder("2.5")
          .buildMSH({
            msh_10: "MSG00001",
            msh_11_1: "P",
            msh_3: "MY_APP",
            msh_4: "MY_FAC",
            msh_5: "EPIC",
            msh_6: "HOSP",
            msh_9_1: "ADT",
            msh_9_2: "A01",
          })
          .toMessage();
        expect(message.toString()).toContain("2.5");
      });
    });
  });
});
