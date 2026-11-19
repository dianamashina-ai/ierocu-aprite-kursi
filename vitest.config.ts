import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // "server-only" Next.js vidē aizsargā servera kodu; testos tas nav vajadzīgs
      "server-only": path.resolve(__dirname, "tests/stubs/empty.ts"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // DB testi koplieto vienu testu datubāzi — palaižam secīgi
    fileParallelism: false,
    testTimeout: 60_000,
  },
});
