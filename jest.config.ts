/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  // TypeScript files must first be transformed to JS for testing.
  transform: {
    '\\.ts$': ['ts-jest', { useESM: true }]
  },

  // Jest doesn't like importing TypeScript files including the ".js" suffix, so
  // remove it.
  moduleNameMapper: {
    '(.+)\\.js': '$1'
  },

  // Treat all TypeScript files as ECMAScript modules.
  extensionsToTreatAsEsm: ['.ts'],

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/__tests__/**/*.[jt]s",
    "**/?(*.)+(spec|test).[tj]s"
  ],

   // An array of regexp pattern strings that are matched against all test
   // paths, matched tests are skipped
   testPathIgnorePatterns: [
     "/node_modules/"
   ],
}

export default config;
