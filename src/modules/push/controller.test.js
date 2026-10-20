import { sendTestPush } from './controller.js';
import { sendToUsers } from './service.js';

jest.mock('./service.js', () => ({ sendToUsers: jest.fn(), ok: jest.fn() }));
jest.mock('../../utils/helpers.js', () => ({ formatApiResponse: ({ status, message, data }) => ({
  returnCode: status, returnMessage: message, returnData: data,
}) }));

it('can target web only so browser tests do not pass merely because a phone received them', async () => {
  sendToUsers.mockResolvedValue({ sent: 1 });
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  await sendTestPush({ user: { id: 'reader' }, body: { platform: 'web' } }, res);
  expect(sendToUsers).toHaveBeenCalledWith(['reader'], expect.objectContaining({ platforms: ['web'] }));
});

it('rejects invalid test platform values', async () => {
  sendToUsers.mockClear();
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  await sendTestPush({ user: { id: 'reader' }, body: { platform: 'other' } }, res);
  expect(res.status).toHaveBeenCalledWith(400); expect(sendToUsers).not.toHaveBeenCalled();
});

it.each([
  [{ sent: 0, disabled: true }, 503],
  [{ sent: 0, noTokens: true }, 409],
  [{ sent: 0, errorCodes: ['messaging/authentication-error'] }, 502],
])('does not report a successful test push for %j', async (result, status) => {
  sendToUsers.mockResolvedValue(result);
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  await sendTestPush({ user: { id: 'reader' } }, res);
  expect(res.status).toHaveBeenCalledWith(status);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ returnCode: status }));
});
