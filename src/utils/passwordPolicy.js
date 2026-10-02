export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 8 characters with uppercase, lowercase, number, and special character";

/**
 * Enforce the application password policy.
 * Returns null when valid, or a human-readable message when not.
 * Kept identical to the UI's rule (min 8 chars) plus the complexity the
 * forced-change flow already required, so all entry points agree.
 */
export const validatePassword = (password) => {
  if (typeof password !== "string" || password.length < 8) {
    return PASSWORD_REQUIREMENTS_MESSAGE;
  }
  if (
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return PASSWORD_REQUIREMENTS_MESSAGE;
  }
  return null;
};