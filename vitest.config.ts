import { defineConfig } from "vitest/config";
import {
  vitestSetupFilePath,
  getClarinetVitestsArgv,
} from "@stacks/clarinet-sdk/vitest";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "clarinet",
    globals: true,
    setupFiles: [vitestSetupFilePath, "./tests/setup.ts"],
    testTimeout: 120000,
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
    environmentOptions: {
      clarinet: {
        ...getClarinetVitestsArgv(),
      },
    },
  },
});
