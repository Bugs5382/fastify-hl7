import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ["<rootDir>/__tests__/",],
  testPathIgnorePatterns: ['/__hl7__/', '/__utils__/'],
  resolver: 'jest-ts-webcompat-resolver',
}

export default jestConfig
