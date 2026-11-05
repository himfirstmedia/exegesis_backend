import fs from 'node:fs';
import path from 'node:path';

test('shared catalogue includes authored mobile and web copy', () => {
  const catalogue = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'src/modules/text-to-text-translation/ui-pack-source.json'), 'utf8'));
  expect(catalogue.texts).toEqual(expect.arrayContaining([
    'Keep growing in the Word',
    'If an eligible account exists, a reset code will be sent to its email address.',
    'Please write your study notes before continuing.',
  ]));
});
