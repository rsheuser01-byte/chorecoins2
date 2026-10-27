import test from 'node:test';
import assert from 'node:assert/strict';
import { signupOutcome, shouldRouteToRecovery } from '../src/lib/authFlows.ts';

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
