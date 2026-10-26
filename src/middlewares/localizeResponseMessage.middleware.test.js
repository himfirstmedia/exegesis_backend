import { localizeResponseMessage } from './localizeResponseMessage.middleware.js';
import { translateText } from '../utils/translator.js';

jest.mock('../utils/translator.js', () => ({
  normalizeLanguage: jest.fn(lang => (typeof lang === 'string' ? lang : 'en')),
  translateText: jest.fn(),
}));

const setup = ({ lang = 'fr', path = '/journal/get-all', statusCode = 200 } = {}) => {
  const req = { path, body: { lang }, query: {} };
  const json = jest.fn();
  const res = { statusCode, json };
  const next = jest.fn();
  localizeResponseMessage()(req, res, next);
  return { req, res, next, json };
};

describe('localizeResponseMessage middleware', () => {
  beforeEach(() => {
    translateText.mockReset().mockImplementation(async (text, lang) => `${lang}:${text}`);
  });

  test('translates the envelope into the request language', async () => {
    const { res, next, json } = setup({ lang: 'fr' });
    expect(next).toHaveBeenCalled();
    await res.json({ returnCode: 200, returnMessage: 'Plan fetched', returnData: { id: 1 } });
    expect(translateText).toHaveBeenCalledWith('Plan fetched', 'fr');
    expect(json).toHaveBeenLastCalledWith({
      returnCode: 200,
      returnMessage: 'fr:Plan fetched',
      returnData: { id: 1 },
    });
  });

  test('leaves English responses untouched', async () => {
    const { res, json } = setup({ lang: 'en' });
    await res.json({ returnCode: 200, returnMessage: 'Plan fetched' });
    expect(translateText).not.toHaveBeenCalled();
    expect(json).toHaveBeenLastCalledWith({ returnCode: 200, returnMessage: 'Plan fetched' });
  });

  test('skips the translation endpoints to avoid recursive provider work', async () => {
    const { res, json } = setup({ lang: 'fr', path: '/translation/batch' });
    await res.json({ returnCode: 200, returnMessage: 'Batch translated' });
    expect(translateText).not.toHaveBeenCalled();
  });

  test('falls back to the source message when the provider fails', async () => {
    translateText.mockRejectedValueOnce(new Error('offline'));
    const { res, json } = setup({ lang: 'ar' });
    await res.json({ returnCode: 500, returnMessage: 'Internal server error' });
    expect(json).toHaveBeenLastCalledWith({
      returnCode: 500,
      returnMessage: 'Internal server error',
    });
  });

  test('honours a message that a module already localized', async () => {
    const { res, json } = setup({ lang: 'fr' });
    await res.json({
      returnCode: 200,
      returnMessage: 'Tickets récupérés',
      messageLanguage: 'fr',
    });
    expect(translateText).not.toHaveBeenCalled();
    expect(json).toHaveBeenLastCalledWith({
      returnCode: 200,
      returnMessage: 'Tickets récupérés',
      messageLanguage: 'fr',
    });
  });
});
