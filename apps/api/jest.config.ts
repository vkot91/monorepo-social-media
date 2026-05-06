import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  moduleNameMapper: {
    "^#common/(.*)$": "<rootDir>/src/common/$1",
    "^#config/(.*)$": "<rootDir>/src/config/$1",
    "^#modules/(.*)$": "<rootDir>/src/modules/$1",
  },
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.controller.ts"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    "./src/**/*.service.ts": {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    "./src/**/*.guard.ts": {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageDirectory: "coverage",
  testEnvironment: "node",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "main\\.ts$", // bootstrap
    "app\\.module\\.ts$", // same as other module files
  ],
};

export default config;
