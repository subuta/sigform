import * as fs from "fs";
import { pathsToModuleNameMapper } from "ts-jest";

const { compilerOptions } = JSON.parse(
  fs.readFileSync("./tsconfig.json", { encoding: "utf-8" }),
);

// node_modules dependencies written served as ESM.
// SEE: [Pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)
const esmPackages = [];

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "@happy-dom/jest-environment",
  testMatch: ["<rootDir>/src/__tests__/**/*.[jt]s?(x)"],
  roots: ["<rootDir>"],
  modulePaths: [compilerOptions.baseUrl],
  // Only allow "@/*" style import in tests.
  moduleNameMapper: pathsToModuleNameMapper({
    "@/*": ["src/*"],
    "fixtures/*": ["fixtures/*"],
  }),
  globalSetup: "./globalSetup.js",
  transformIgnorePatterns: [`/node_modules/(?!${esmPackages.join("|")})`],
};
