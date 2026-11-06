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
// Only drop strings that are genuinely SQL statements. Testing the leading
// keyword alone also discarded authored UI copy such as "Create user",
// "Select a chapter", "Update Failed: " and "Update the fields you want and
// tap Save.", leaving those screens in English.
const isSqlStatement = value => /^(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b[\s\S]*\b(?:FROM|INTO|SET|TABLE|WHERE|VALUES|DATABASE|INDEX|JOIN|GROUP\s+BY|ORDER\s+BY)\b/i.test(value);
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
        if (/^[A-Z][A-Za-z]*(?:[ .!?…:,]|$)/.test(value) && !/https?:|#[0-9a-f]{3,8}\b/i.test(value) && !isSqlStatement(value) && !/^(?:\.\.?\/|\/|\\)/.test(value) && value.length < 10000) add(value);
        const parent = node.parent;
        if (ts.isCallExpression(parent) && /^(?:t|text|tt|ui|useTranslation)$/.test(parent.expression.getText(parsed)) && parent.arguments[0] === node) add(value);
        if (isCopyConstantValue(node)) add(value);
        if (isKeywordValue(node)) add(value);
      }
      ts.forEachChild(node, visit);
    };
    visit(parsed);
  }
};
for (const name of ['features', 'component', 'reusable', 'hooks']) scan(path.join(app, name));
// Web installs the same source-indexed packs from the backend. Its authored
// labels must participate in the revision too, not just mobile copy.
const web = path.join(root, 'web/src');
walkValues(JSON.parse(fs.readFileSync(path.join(web, 'components/languages/en.json'), 'utf8')));
for (const name of ['features', 'components', 'hooks']) scan(path.join(web, name));
// Admin API wrappers also own fallback error messages shown by pack-backed
// toasts. Scan their authored literals, never response/user data.
scan(path.join(app, 'features/admin/services'));
// Global API interceptor feedback is shown through the pack-backed toast
// wrapper. The api module also holds headers, routes and error codes, so add
// only the two authored messages instead of scanning the whole directory.
for (const message of [
  'The server is busy right now — please try again in a moment.',
  'Session Expired. Please login again.',
]) add(message);
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
// Brand labels have authored local-script spellings. Providers often return
// "Google" unchanged, overriding those spellings in otherwise localized UI.
// Carry these explicit authored choices into the offline pack, not a runtime
// translation exception. Include them in the revision to invalidate old packs.
const overrides = {};
for (const name of fs.readdirSync(localeRoot).sort()) {
  if (!/^[a-z]{2,3}\.json$/.test(name)) continue;
  const language = name.slice(0, -5);
  const locale = JSON.parse(fs.readFileSync(path.join(localeRoot, name), 'utf8'));
  const labels = {};
  for (const [source, key] of [['Google', 'google'], ['LordsBook', 'lordsbook']]) {
    const value = locale.login?.[key];
    if (typeof value === 'string' && value.trim()) labels[source] = value;
  }
  if (Object.keys(labels).length) overrides[language] = labels;
}
// A provider can echo the English source for very short labels ("Sort",
// "Clear", "Newest") or pick the wrong sense ("Export" as goods, "Tag" as a
// day). Curated overrides pin those ambiguous UI words to reviewed wording.
// They are source-keyed so they follow the same validation and revision hash
// as authored brand spellings.
const curatedOverrides = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'ui-pack-overrides.json'), 'utf8'));
for (const [language, labels] of Object.entries(curatedOverrides)) {
  overrides[language] = { ...(overrides[language] || {}), ...labels };
}
const revision = createHash('sha256').update(`ui-v2:${JSON.stringify({ texts, overrides })}`).digest('hex').slice(0, 12);
const catalog = JSON.stringify({ schemaVersion: 1, revision, texts, overrides }, null, 2) + '\n';
const targets = [path.join(app, 'services/translation/ui-pack-source.json'), path.join(root, 'backend/src/modules/text-to-text-translation/ui-pack-source.json')];
if (process.argv.includes('--check')) {
  if (targets.some(file => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== catalog)) {
    console.error('UI catalogue is stale. Run npm run extract:ui-packs in backend before building both releases.'); process.exitCode = 1;
  }
} else for (const target of targets) fs.writeFileSync(target, catalog);
console.log(`UI sources: ${texts.length}; revision ${revision}`);
