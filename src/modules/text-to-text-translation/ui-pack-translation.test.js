import { protectUiText, translateUiSpans, abortable } from './ui-pack-translation.js';

test('hides interpolation tokens and restores exact names after translation', () => {
  const protectedText = protectUiText('-- Select {field} --');
  expect(protectedText.text).toBe('-- Select ZXQPH0QXZ --');
  expect(protectedText.restore('-- Seleccione ZXQPH0QXZ --')).toBe('-- Seleccione {field} --');
  expect(protectedText.restore('-- Seleccione {campo} --')).toBeNull();
});
test('preserves repeated tokens, double braces, printf variables and markup', () => {
  const input = '<b>Hello {{name}}</b> {count} / {count} %1$s';
  const protectedText = protectUiText(input);
  expect(protectedText.restore(protectedText.text)).toBe(input);
  expect(protectedText.restore(protectedText.text.replace('ZXQPH0QXZ', ''))).toBeNull();
  expect(protectedText.restore(protectedText.text + ' ZXQPH0QXZ')).toBeNull();
});
test('literal-span fallback keeps placeholders out of the provider and preserves spacing', async () => {
  const translate = jest.fn(async texts => texts.map(text => text === 'Select' ? 'Seleccione' : `trad:${text}`));
  expect(await translateUiSpans('Select {field} now', 'es', translate)).toBe('Seleccione {field} trad:now');
  expect(translate.mock.calls[0][0]).toEqual(['Select', 'now']);
  expect(await translateUiSpans('{count}', 'fr', translate)).toBe('{count}');
});
test('empty spans are rejected rather than published as English', async () => {
  await expect(translateUiSpans('Select {field}', 'es', async () => [''])).rejects.toThrow('empty');
});
test('aborting an outstanding provider promise releases the builder wait', async () => {
  const controller = new AbortController();
  const pending = abortable(new Promise(() => {}), controller.signal);
  controller.abort();
  await expect(pending).rejects.toThrow('interrupted');
});
