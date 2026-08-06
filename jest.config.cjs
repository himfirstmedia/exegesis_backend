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
};
