import fs from 'node:fs';
import path from 'node:path';

test('shared catalogue includes authored mobile and web copy', () => {
  const catalogue = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'src/modules/text-to-text-translation/ui-pack-source.json'), 'utf8'));
  expect(catalogue.texts).toEqual(expect.arrayContaining([
    'Keep growing in the Word',
    'If an eligible account exists, a reset code will be sent to its email address.',
    'Please write your study notes before continuing.',
    // Settings & Account screen: group titles and management errors.
    'Settings & Account',
    'Appearance & Language',
    'Reading & Downloads',
    'Subscription',
    'Legal',
    'Account Actions',
    'Subscription management unavailable',
    'We could not open subscription management. Please try again.',
    // Authored copy that starts with a SQL keyword but is not SQL. The
    // extractor used to drop it, leaving these labels in English.
    'Create user',
    'Select a chapter',
    'Update Failed: ',
    'Update the fields you want and tap Save.',
  ]));
});
