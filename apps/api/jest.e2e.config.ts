import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  moduleNameMapper: {
    "^#common/(.*)$": "<rootDir>/src/common/$1",
    "^#config/(.*)$": "<rootDir>/src/config/$1",
    "^#modules/(.*)$": "<rootDir>/src/modules/$1",
    "^#test/(.*)$": "<rootDir>/src/test/$1",
  },
  rootDir: ".",
  setupFiles: ["<rootDir>/jest.env.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/test/e2e/setup.ts"],
  testEnvironment: "node",
  testRegex: ".*\\.e2e-spec\\.ts$",
  testTimeout: 30000,
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
};

export default config;
