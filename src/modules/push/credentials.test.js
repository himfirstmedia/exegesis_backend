const mockAccessToken = jest.fn().mockRejectedValue(new Error('Could not load default credentials'));
const mockSendEach = jest.fn();
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(), getApps: jest.fn(() => []), cert: jest.fn(),
}));
jest.mock('firebase-admin/messaging', () => ({
  getMessaging: jest.fn(() => ({
    app: { options: { credential: { getAccessToken: mockAccessToken } } },
    sendEach: mockSendEach,
  })),
}));
jest.mock('../../config/db.js', () => ({ prisma: { pushToken: { findMany: jest.fn() } } }));

const { sendToUsers } = require('./service.js');

it('reports unavailable credentials instead of pretending Firebase initialization means push is ready', async () => {
  const result = await sendToUsers(['reader'], { title: 'Support', body: 'Reply' });
  expect(result).toMatchObject({ sent: 0, disabled: true });
  expect(mockAccessToken).toHaveBeenCalledTimes(1);
  expect(mockSendEach).not.toHaveBeenCalled();
});
