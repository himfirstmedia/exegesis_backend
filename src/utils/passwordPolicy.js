export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 8 characters with uppercase, lowercase, number, and special character";
export const SIGNUP_PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 8 characters with uppercase, lowercase, and a number";

/**
 * Enforce the application password policy.
 * Returns null when valid, or a human-readable message when not.
 * Email signup makes symbols optional. Other password flows keep their
 * existing symbol requirement by default.
 */
export const validatePassword = (password, { requireSymbol = true } = {}) => {
  const message = requireSymbol ? PASSWORD_REQUIREMENTS_MESSAGE : SIGNUP_PASSWORD_REQUIREMENTS_MESSAGE;
  if (typeof password !== "string" || password.length < 8) {
    return message;
  }
  if (
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    (requireSymbol && !/[^A-Za-z0-9]/.test(password))
  ) {
    return message;
  }
  return null;
};
