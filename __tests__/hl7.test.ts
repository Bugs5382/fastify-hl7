import fastify, { FastifyInstance } from "fastify";
import fs from "fs";
import Server from "node-hl7-server";
import path from "path";
import { describe, expect, test, beforeEach, afterEach } from "vitest";
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
      } catch (err) {
        expect(err).toEqual(
          new errors.FASTIFY_HL7_ERR_SETUP_ERRORS("Already registered."),
        );
      }
    });

    test("...createInbound -- name -- failure", async () => {
      await app.register(fastifyHL7);
      try {
        app.hl7.createInbound("adt/23*4&", { port: 1234 }, async () => {});
      } catch (err) {
        expect(err).toEqual(
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
        } catch (err) {
          expect(err).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "server was not started. re-register plugin with enableServer set to true.",
            ),
          );
        }
      });

      test("...closeServer -- failure", async () => {
        try {
          await app.hl7.closeServer("1234");
        } catch (err) {
          expect(err).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "server was not started. re-register plugin with enableServer set to true.",
            ),
          );
        }
      });

      test("...closeServerAll -- failure", async () => {
        try {
          await app.hl7.closeServerAll();
        } catch (err) {
          expect(err).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "server was not started. re-register plugin with enableServer set to true.",
            ),
          );
        }
      });

      test("...getServerByName -- failure", async () => {
        try {
          await app.hl7.getServerByName("test");
        } catch (err) {
          expect(err).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "server was not started. re-register plugin with enableServer set to true.",
            ),
          );
        }
      });

      test("...getServerByPort -- failure", async () => {
        try {
          await app.hl7.getServerByPort("1234");
        } catch (err) {
          expect(err).toEqual(
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
      } catch (err) {
        expect(err).toEqual(
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
        } catch (err) {
          expect(err).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~.",
            ),
          );
        }
      });

      test("...createClient - name already used -- failure", async () => {
        try {
          app.hl7.createClient("hello", { host: "dummy.local" });
          app.hl7.createClient("hello", { host: "dummy.local" });
        } catch (err) {
          expect(err).toEqual(
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
        } catch (err) {
          expect(err).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~.",
            ),
          );
        }
      });

      test("...createConnection - none existing -- failure", async () => {
        try {
          app.hl7.createConnection("hello", { port: 1234 }, async () => {});
        } catch (err) {
          expect(err).toEqual(
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
        const client = app.hl7.createClient("adt", { host: "0.0.0.0" });
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
        } catch (err) {
          expect(err).toEqual(
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
        } catch (err) {
          expect(err).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "Use readFile or readFileBuffer method. This is for building.",
            ),
          );
        }
      });

      test("...buildBatch -- must be a message type", async () => {
        try {
          app.hl7.buildBatch({ text: "BHS" });
        } catch (err) {
          expect(err).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "Use processMessage method. This is for building.",
            ),
          );
        }
      });

      test("...buildMessage -- with text", async () => {
        try {
          app.hl7.buildMessage({ text: "MSH" });
        } catch (err) {
          expect(err).toEqual(
            new errors.FASTIFY_HL7_ERR_USAGE(
              "Use processMessage method. This is for building.",
            ),
          );
        }
      });
    });
  });
});
