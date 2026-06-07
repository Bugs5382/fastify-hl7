import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  // Declarations are emitted by tsc, not rolldown's dts bundler: this package
  // augments `fastify` (declare module "fastify"), which the bundler can't
  // follow through fastify's own types. tsc handles the augmentation natively.
  dts: false,
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  sourcemap: true,
});
