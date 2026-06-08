import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  moduleNameMapper: {
    "^#common/(.*)$": "<rootDir>/src/common/$1",
    "^#config/(.*)$": "<rootDir>/src/config/$1",
    "^#e2e/(.*)$": "<rootDir>/e2e/$1",
    "^#modules/(.*)$": "<rootDir>/src/modules/$1",
    "^#test/(.*)$": "<rootDir>/src/test/$1",
  },
  rootDir: ".",
  setupFiles: ["<rootDir>/jest.env.ts"],
  setupFilesAfterEnv: ["<rootDir>/e2e/support/setup.ts"],
  testEnvironment: "node",
  testRegex: ".*\\.e2e-spec\\.ts$",
  testTimeout: 30000,
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
};

export default config;
