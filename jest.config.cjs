/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/scripts/jest-environment.cjs"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        module: "CommonJS",
        moduleResolution: "node",
        target: "ES2022",
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
        allowJs: true,
        types: ["jest", "node"],
      },
      useESM: false,
    }],
    "^.+\\.m?js$": ["babel-jest", {
      presets: [["@babel/preset-env", { targets: { node: "current" } }]],
      plugins: [require.resolve("./jest-import-meta.plugin.cjs")],
    }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  extensionsToTreatAsEsm: [],
  // Avoid scanning the bundled 140MB+ Bible XML dataset as test/transform targets.
  testPathIgnorePatterns: [
    "/node_modules/",
    "/Holy-Bible-XML-Format/",
    "/__fixtures__/",
    ...(process.env.RUN_DB_INTEGRATION === "1" ? [] : [
      "/verse-explanation.test.ts$",
      "/highlight-offline-delete.test.ts$",
    ]),
  ],
};
