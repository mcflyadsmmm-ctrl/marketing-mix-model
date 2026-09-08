import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@mcfly/mer-engine": path.resolve(
        __dirname,
        "../packages/mer-engine/src/index.ts",
      ),
      "@mcfly/mer-core": path.resolve(
        __dirname,
        "../packages/mer-core/src/index.ts",
      ),
    },
  },
  test: {
    include: ["app/**/*.test.ts"],
  },
});
