import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
  },
  resolve: {
    alias: [
      { find: "@/emails", replacement: path.resolve(__dirname, "./emails") },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
});
