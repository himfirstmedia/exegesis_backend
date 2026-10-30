// Build-time only: scan authored source, never user data, credentials or API responses.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const app = path.join(root, 'app/src');
const sources = new Set();
const add = value => { if (typeof value === 'string' && value.trim() && /[A-Za-z]/.test(value)) sources.add(value); };
const walkValues = value => {
  if (typeof value === 'string') add(value);
  else if (value && typeof value === 'object') Object.values(value).forEach(walkValues);
};
const localeRoot = path.join(app, 'component/language-translation');
walkValues(JSON.parse(fs.readFileSync(path.join(localeRoot, 'en.json'), 'utf8')));
const bundles = path.join(localeRoot, 'screenLocales');
for (const name of fs.readdirSync(bundles)) {
  const file = path.join(bundles, name, 'en.json');
  if (fs.existsSync(file)) walkValues(JSON.parse(fs.readFileSync(file, 'utf8')));
}
// Authored copy constants (`BASE_COPY`, `EXTRA_COPY`, `SOWER_COPY`, …) hold
// user-facing strings the generic sentence heuristic misses: short labels
// ("answer", "accuracy") and placeholder-led templates ("{count} in a row").
// They are consumed through the static-copy hook, so every literal value must be
// in the pack or the screen falls back to English. Detect only the value side of
// a `*_COPY` container (object values or array elements) so keys, codes and
// style maps stay out. Support splits its copy across `sharedCopy`, `inboxCopy`,
// `helpCopy`, ... arrays, whose brace- or digit-led entries the sentence
// heuristic skips.
const isCopyConstantValue = node => {
  const container = node.parent;
  let literal;
  if (ts.isPropertyAssignment(container) && container.initializer === node) {
    literal = container.parent;
  } else if (ts.isArrayLiteralExpression(container)) {
    literal = container;
  } else {
    return false;
  }
  if (!ts.isObjectLiteralExpression(literal) && !ts.isArrayLiteralExpression(literal)) return false;
  let declaration = literal.parent;
  while (ts.isAsExpression(declaration) || ts.isParenthesizedExpression(declaration)) declaration = declaration.parent;
  return ts.isVariableDeclaration(declaration) && ts.isIdentifier(declaration.name) && /_?COP(?:Y|IES)$/i.test(declaration.name.text);
};
// Support FAQ `keywords` are localized search aliases rendered by the support
// translator, so their lowercase tokens must also be in the pack.
const isKeywordValue = node => {
  const array = node.parent;
  if (!ts.isArrayLiteralExpression(array)) return false;
  const property = array.parent;
  return ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === 'keywords';
};
const scan = dir => {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) { if (!['assets', 'language-translation', 'services', 'theme', 'types'].includes(item.name)) scan(file); continue; }
    if (!/\.tsx?$/.test(item.name) || /\.(test|spec)\./.test(item.name)) continue;
    const parsed = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = node => {
      if (ts.isJsxText(node)) add(node.text.trim());
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        const value = node.text;
        // Curated locale JSON is exhaustive. Supplement authored screen copy,
        // including support FAQ answers, while excluding paths, keys and code.
        if (/^[A-Z][A-Za-z]*(?:[ .!?…:,]|$)/.test(value) && !/https?:|#[0-9a-f]{3,8}\b|^(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(value) && !/^(?:\.\.?\/|\/|\\)/.test(value) && value.length < 10000) add(value);
        const parent = node.parent;
        if (ts.isCallExpression(parent) && /^(?:t|text|tt|useTranslation)$/.test(parent.expression.getText(parsed)) && parent.arguments[0] === node) add(value);
        if (isCopyConstantValue(node)) add(value);
        if (isKeywordValue(node)) add(value);
      }
      ts.forEachChild(node, visit);
    };
    visit(parsed);
  }
};
for (const name of ['features', 'component', 'reusable', 'hooks']) scan(path.join(app, name));
// Legal screens request bounded chunks, not just the full source literals.
// Evaluate only these pure authored modules so constants/interpolations and the
// exact same sentence/word splitting used by the app are preserved in the pack.
const readPureModule = relative => {
  const file = path.join(app, relative);
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: file,
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports }, { filename: file, timeout: 1000 });
  return exports;
};
const { TERMS_OF_SERVICE, PRIVACY_POLICY, LEGAL_CHUNK_CHARACTERS } = readPureModule('features/legal/content.ts');
const { splitTranslationText } = readPureModule('services/translation/textChunks.ts');
add('Last updated');
for (const document of [TERMS_OF_SERVICE, PRIVACY_POLICY]) {
  for (const section of document.sections) {
    for (const text of [section.heading, ...section.paragraphs, ...(section.bullets || [])]) {
      add(text);
      for (const chunk of splitTranslationText(text, LEGAL_CHUNK_CHARACTERS)) add(chunk.text);
    }
  }
}
const texts = [...sources].sort();
const revision = createHash('sha256').update(`ui-v1:${JSON.stringify(texts)}`).digest('hex').slice(0, 12);
const catalog = JSON.stringify({ schemaVersion: 1, revision, texts }, null, 2) + '\n';
const targets = [path.join(app, 'services/translation/ui-pack-source.json'), path.join(root, 'backend/src/modules/text-to-text-translation/ui-pack-source.json')];
if (process.argv.includes('--check')) {
  if (targets.some(file => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== catalog)) {
    console.error('UI catalogue is stale. Run npm run extract:ui-packs in backend before building both releases.'); process.exitCode = 1;
  }
} else for (const target of targets) fs.writeFileSync(target, catalog);
console.log(`UI sources: ${texts.length}; revision ${revision}`);
