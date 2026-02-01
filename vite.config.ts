// ABOUTME: Vite build configuration for the Top Gun flight combat game.
// ABOUTME: Configures TypeScript compilation and Vitest test runner.

import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
});
