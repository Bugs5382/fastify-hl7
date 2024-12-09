import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      exclude: [
        ...configDefaults.exclude,
        "__tests__/**/**",
        "src/api.ts",
        "docker",
        "bin",
        "certs",
        "docs",
        "lib",
      ],
    },
  },
});
