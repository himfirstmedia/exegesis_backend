/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "node",
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
  ],
  // cacheService creates a Redis client at import; its idle connection keeps
  // the event loop open after tests finish, so force exit after the run.
  forceExit: true,
};
