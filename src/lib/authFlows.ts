/** A successful signup may still require email verification before a session exists. */
export function signupOutcome(session: unknown, error: { message: string } | null) {
  if (error) return { success: false, error: error.message };
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
