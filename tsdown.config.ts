import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  // Declarations are emitted by tsc, not rolldown's dts bundler: this package
  // augments `fastify` (declare module "fastify"), which the bundler can't
  // follow through fastify's own types. tsc handles the augmentation natively.
  dts: false,
  clean: true,
  sourcemap: true,
});
