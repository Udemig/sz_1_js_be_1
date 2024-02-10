export default {
  verbose: true,
  transformIgnorePatterns: ["node_modules/(?!(sucrase)/)"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx|mjs)$": "babel-jest",
  },

  testEnvironment: "node",

  testMatch: [
    "**/tests/**/(*.)+(spec|test).[jt]s?(x)",
    "**/tests/**/(*.)+(spec|test).cjs?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
    "**/?(*.)+(spec|test).cjs?(x)",
  ],
  moduleNameMapper: {
    "src/(.*)": "<rootDir>/src/$1",
    "tests/(.*)": "<rootDir>/tests/$1",
  },
};
