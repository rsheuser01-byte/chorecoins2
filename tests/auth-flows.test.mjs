import test from 'node:test';
import assert from 'node:assert/strict';
import { signupOutcome, shouldRouteToRecovery, authErrorMessage, temporaryAuthServiceMessage } from '../src/lib/authFlows.ts';

test('signup without session requires confirmation, not a signed-in welcome', () => {
  assert.deepEqual(signupOutcome(null, null), { success: true, needsEmailConfirmation: true });
});
test('signup with session can continue immediately', () => {
  assert.deepEqual(signupOutcome({ user: { id: 'synthetic-a' } }, null), { success: true, needsEmailConfirmation: false });
});
test('signup errors never become success or confirmation', () => {
  assert.deepEqual(signupOutcome(null, { message: 'Synthetic error' }), { success: false, error: 'Synthetic error' });
});
test('confirmation and magic-link access tokens are not recovery', () => {
  for (const hash of ['#access_token=synthetic&type=signup', '#access_token=synthetic&type=magiclink', '#access_token=synthetic', '#error=access_denied']) {
    assert.equal(shouldRouteToRecovery(hash, '/', false), false);
  }
});
test('explicit recovery link routes once without looping', () => {
  assert.equal(shouldRouteToRecovery('#type=recovery&access_token=synthetic', '/', false), true);
  assert.equal(shouldRouteToRecovery('#type=recovery&access_token=synthetic', '/reset-password', false), false);
});
test('SDK recovery event still routes after SDK consumes hash', () => {
  assert.equal(shouldRouteToRecovery('', '/', true), true);
  assert.equal(shouldRouteToRecovery('', '/reset-password', true), false);
});
test('unrelated hashes or substring matches do not route', () => {
  assert.equal(shouldRouteToRecovery('#other=type%3Drecovery', '/', false), false);
  assert.equal(shouldRouteToRecovery('', '/', false), false);
});


test('reset requires a verified recovery event, not an unrelated existing session or claimed hash', async () => {
  const { canResetPassword } = await import('../src/lib/authFlows.ts');
  assert.equal(canResetPassword(true, false, '#type=recovery&access_token=invalid'), false);
  assert.equal(canResetPassword(true, false, ''), false);
  assert.equal(canResetPassword(false, true, ''), false);
  assert.equal(canResetPassword(true, true, '#error=access_denied&error_code=otp_expired'), false);
  assert.equal(canResetPassword(true, true, ''), true);
});


test('server 500 and 504 errors explain temporary service trouble rather than password failure', () => {
  for (const status of [500, 502, 503, 504]) {
    assert.equal(authErrorMessage({ status, message: 'Internal error' }), temporaryAuthServiceMessage);
    assert.deepEqual(signupOutcome(null, { status, message: 'Internal error' }), { success: false, error: temporaryAuthServiceMessage });
  }
});
test('network and timeout exceptions receive actionable temporary-service guidance', () => {
  for (const error of [new TypeError('Failed to fetch'), new Error('fetch failed'), new Error('Network request failed'), new Error('Connection timed out'), { name: 'TimeoutError' }, { name: 'AbortError' }, { status: 0 }]) {
    assert.equal(authErrorMessage(error), temporaryAuthServiceMessage);
  }
});
test('validation, invalid-login and rate-limit errors retain their specific guidance', () => {
  for (const [status, message] of [[400, 'Email not confirmed'], [400, 'Invalid login credentials'], [422, 'Password is too short'], [429, 'Too many requests']]) {
    assert.equal(authErrorMessage({ status, message }), message);
  }
});
test('unknown failures produce safe fallback text without exposing arbitrary objects', () => {
  assert.equal(authErrorMessage(null), 'Authentication could not be completed. Please try again.');
  assert.equal(authErrorMessage({ secret: 'synthetic-private-field' }), 'Authentication could not be completed. Please try again.');
});
