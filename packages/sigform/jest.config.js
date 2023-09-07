import * as fs from "fs";
import { pathsToModuleNameMapper } from "ts-jest";

const { compilerOptions } = JSON.parse(
  fs.readFileSync("./tsconfig.json", { encoding: "utf-8" }),
);

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "@happy-dom/jest-environment",
  testMatch: ["src/**/__tests__/**/*.[jt]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/__tests__/fixtures"],
  roots: ["<rootDir>"],
  modulePaths: [compilerOptions.baseUrl],
  // Only allow "@/*" style import in tests.
  moduleNameMapper: pathsToModuleNameMapper({
    "@/*": ["src/*"],
    "fixtures/*": ["fixtures/*"],
  }),
};
