import * as fs from "fs";
import { pathsToModuleNameMapper } from "ts-jest";

const { compilerOptions } = JSON.parse(fs.readFileSync("./tsconfig.json"));

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "@happy-dom/jest-environment",
  testPathIgnorePatterns: ["/node_modules/", "/__tests__/fixtures"],
  roots: ["<rootDir>"],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
};
