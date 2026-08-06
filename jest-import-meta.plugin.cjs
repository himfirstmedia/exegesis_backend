/**
 * Babel plugin used by jest.config.cjs.
 *
 * The backend runs as ESM ("type": "module"), so modules reference
 * `import.meta.url`. Jest transforms sources to CommonJS, and Node's CJS
 * parser rejects `import.meta`. This plugin rewrites `import.meta.url` to the
 * CJS-native `__filename`, letting ESM modules load under jest.
 *
 * Referenced by path (not inline) so it survives jest's config serialization
 * when tests run in parallel workers.
 */
module.exports = function importMetaUrlToFilename(babel) {
  return {
    name: "jest-import-meta-url",
    visitor: {
      MemberExpression(path) {
        const { object, property } = path.node;
        if (
          object.type === "MetaProperty" &&
          object.meta.name === "import" &&
          object.property.name === "meta" &&
          !path.node.computed &&
          property.name === "url"
        ) {
          path.replaceWith(babel.types.identifier("__filename"));
          path.skip();
        }
      },
    },
  };
};
