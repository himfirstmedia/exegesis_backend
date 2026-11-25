import router from '../route.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { startSession } from '../controller.js';

jest.mock('../../../middlewares/auth.middleware.js', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Sign in required' });
    return next();
  }),
}));
jest.mock('../../../middlewares/gating.middleware.js', () => ({
  requireTier: () => { throw new Error('Lab routes must not require a paid tier'); },
}));
jest.mock('../controller.js', () =>
  Object.fromEntries([
    'startSession', 'getCurrentSession', 'getSessionHistory', 'getSession',
    'saveProgress', 'saveLookStage', 'saveListenStage', 'saveLearnStage',
    'saveAbideStage', 'saveApplyStage', 'completeSession', 'saveSessionLedger',
    'abandonSession', 'exportSessionPdf',
  ].map(name => [name, jest.fn((req, res) => res.status(200).json({ userId: req.user.id }))])),
);

function post(path, user) {
  const req = { method: 'POST', url: path, user };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  router.handle(req, res, error => { throw error || new Error(`Unhandled ${path}`); });
  return res;
}

test('a free account can start a session and use the protected Lab routes', () => {
  const user = { id: 'free-reader', subscriptionTier: 'free' };
  for (const path of ['/start', '/current', '/history', '/s1', '/s1/look', '/s1/listen',
    '/s1/learn', '/s1/abide', '/s1/apply', '/s1/complete', '/s1/ledger', '/s1/pdf']) {
    expect(post(path, user).status).toHaveBeenCalledWith(200);
  }
  expect(authenticate).toHaveBeenCalled();
  expect(startSession).toHaveBeenCalledWith(expect.objectContaining({ user }), expect.anything(), expect.anything());
});

test('a signed-out guest still cannot start, resume, or save a private study', () => {
  for (const path of ['/start', '/s1', '/s1/progress', '/s1/ledger']) {
    expect(post(path).status).toHaveBeenCalledWith(401);
  }
});
