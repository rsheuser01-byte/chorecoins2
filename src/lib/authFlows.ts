export const temporaryAuthServiceMessage = 'The sign-in service is temporarily unavailable or taking too long. This does not mean your password is wrong. Please wait and try again later.';

/** Keep validation errors useful; do not mislabel server/network outages as bad credentials. */
export function authErrorMessage(error: unknown): string {
  const detail = error && typeof error === 'object' ? error as { status?: unknown; message?: unknown; name?: unknown } : {};
  const message = typeof detail.message === 'string' ? detail.message : '';
  const temporary = (typeof detail.status === 'number' && detail.status >= 500) ||
    detail.status === 0 || detail.name === 'TimeoutError' || detail.name === 'AbortError' ||
    /network|failed to fetch|fetch failed|load failed|timed?\s*out|timeout|connection (?:failed|reset|refused)/i.test(message);
  if (temporary) return temporaryAuthServiceMessage;
  return message || 'Authentication could not be completed. Please try again.';
}

/** A successful signup may still require email verification before a session exists. */
export function signupOutcome(session: unknown, error: { message: string; status?: number } | null) {
  if (error) return { success: false, error: authErrorMessage(error) };
  return { success: true, needsEmailConfirmation: !session };
}

export function shouldRouteToRecovery(hash: string, pathname: string, recoveryEvent: boolean) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return pathname !== '/reset-password' &&
    (params.get('type') === 'recovery' || recoveryEvent);
}

export function canResetPassword(hasSession: boolean, verifiedRecovery: boolean, hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return hasSession && verifiedRecovery && !params.has('error') && !params.has('error_code');
}
