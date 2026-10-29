// Public pack handlers may explicitly override this default. Account APIs must
// never be reused by browsers/proxies after logout or an account switch.
export const privateCache = (_req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.vary('Authorization');
  res.vary('Cookie');
  next();
};
