import type { Config } from "jest";

const jestConfig: Config = {
  // for TypeScript support
  preset: "ts-jest",

  testEnvironment: "node",

  roots: ["<rootDir>/tests", "<rootDir>/src"],

  // setupFilesAfterEnv is an array of file paths that will be executed after the test framework has been installed in the environment but before the test code itself is executed. This is useful for setting up global variables, mocking functions, or configuring testing libraries.
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },

  // clear mock after every tests
  clearMocks: true,

  collectCoverage: true,

  collectCoverageFrom: ["src/**/*.ts", "!src/server.ts", "!src/**/*.d.ts"],

  coverageDirectory: "coverage",

  testMatch: ["**/*.test.ts"],

  testTimeout: 30000,

  moduleFileExtensions: ["ts", "js", "json"],
};

export default jestConfig;
