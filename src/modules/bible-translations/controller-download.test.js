import fs from 'fs';
import { downloadTranslation } from './controller.js';
import { getXmlFilePath } from './service.js';

jest.mock('fs', () => ({
  __esModule: true,
  default: {
    existsSync: jest.fn(),
    statSync: jest.fn(),
    createReadStream: jest.fn(),
  },
}));

jest.mock('./service.js', () => ({
  BOOK_NAMES: {},
  getXmlFilePath: jest.fn(),
}));

jest.mock('../../utils/translator.js', () => ({
  translateText: jest.fn(),
}));

jest.mock('../../config/db.js', () => ({
  prisma: {},
}));

jest.mock('./translation.js', () => ({
  translateBookHeadings: jest.fn(),
  translateChapterHeadings: jest.fn(),
}));

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  setHeader: jest.fn(),
  json: jest.fn().mockReturnThis(),
  end: jest.fn().mockReturnThis(),
});

describe('Bible translation downloads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getXmlFilePath.mockReturnValue('/bibles/AssameseBible.xml');
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({ size: 100 });
    fs.createReadStream.mockReturnValue({ pipe: jest.fn() });
  });

  test('returns a valid bounded range with the canonical catalog id', async () => {
    const req = {
      params: { translationId: 'Assamese' },
      headers: { range: 'bytes=25-49' },
    };
    const res = makeResponse();

    await downloadTranslation(req, res);

    expect(res.status).toHaveBeenCalledWith(206);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Range',
      'bytes 25-49/100',
    );
    expect(res.setHeader).toHaveBeenCalledWith('Content-Length', 25);
    expect(res.setHeader).toHaveBeenCalledWith('X-Bible-Id', 'Assamese');
    expect(fs.createReadStream).toHaveBeenCalledWith(
      '/bibles/AssameseBible.xml',
      { start: 25, end: 49 },
    );
  });

  test.each(['bytes=100-', 'bytes=50-25', 'garbage', 'bytes=-0'])(
    'rejects an invalid or unsatisfiable range: %s',
    async range => {
      const req = {
        params: { translationId: 'Assamese' },
        headers: { range },
      };
      const res = makeResponse();

      await downloadTranslation(req, res);

      expect(res.status).toHaveBeenCalledWith(416);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Range',
        'bytes */100',
      );
      expect(fs.createReadStream).not.toHaveBeenCalled();
    },
  );
});
