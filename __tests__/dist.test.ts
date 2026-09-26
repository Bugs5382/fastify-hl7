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
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "tsdown";
import { afterEach, beforeAll, describe, expect, test } from "vitest";

// The rest of the suite runs against src/, which hides interop bugs that only
// show up in the bundles (#145). Build the real ESM and CJS output with the
// repo's tsdown config and load each one the way a consumer would. The output
// goes under node_modules so the bundles resolve the installed dependencies.
const outDir = path.resolve(
  import.meta.dirname,
  "../node_modules/.cache/fastify-hl7-dist-test",
);

let app: FastifyInstance | undefined;

beforeAll(async () => {
  await build({ logLevel: "silent", outDir, sourcemap: false });
}, 60_000);

afterEach(async () => {
  await app?.close();
  app = undefined;
});

const exercise = async (plugin: unknown) => {
  app = fastify();
  await app.register(plugin as never);
  expect(app.hl7._serverInstance).toBeDefined();
  const client = app.hl7.createClient("dist_client", {
    host: "127.0.0.1",
    version: "2.7",
  });
  expect(client).toBeDefined();
};

describe("built package", () => {
  test("...CommonJS build registers and creates a client", async () => {
    const require = createRequire(import.meta.url);
    const plugin = require(path.join(outDir, "index.cjs"));
    expect(typeof plugin).toBe("function");
    await exercise(plugin);
  });

  test("...ESM build registers and creates a client", async () => {
    const module_ = await import(
      pathToFileURL(path.join(outDir, "index.mjs")).href
    );
    expect(typeof module_.default).toBe("function");
    await exercise(module_.default);
  });
});
