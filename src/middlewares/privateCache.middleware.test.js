import { privateCache } from './privateCache.middleware.js';

test('API defaults prevent shared and browser storage and vary by credentials', () => {
  const res = { setHeader: jest.fn(), vary: jest.fn() };
  const next = jest.fn();
  privateCache({}, res, next);
  expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store');
  expect(res.vary).toHaveBeenCalledWith('Authorization');
  expect(res.vary).toHaveBeenCalledWith('Cookie');
  expect(next).toHaveBeenCalledTimes(1);
});
