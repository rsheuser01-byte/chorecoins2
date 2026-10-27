import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('retired background handler cannot read credentials, query or push', async () => {
  const source = readFileSync(new URL('../supabase/functions/send-chore-reminders/index.ts', import.meta.url), 'utf8');
  let handler;
  new Function('Deno', source)({ serve: fn => { handler = fn; } });
  const response = await handler(new Request('https://example.invalid', { method: 'POST' }));
  assert.equal(response.status, 410);
  assert.equal((await response.json()).enabled, false);
  assert.doesNotMatch(source, /Deno\.env|createClient|fetch\(|\.from\(|\.rpc\(/);
});

test('new reminder review branch has deployment guard before publication', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.equal(config.git.deploymentEnabled['codex/in-app-reminders-20261027'], false);
  assert.equal(config.git.deploymentEnabled['codex/account-auth-isolation-20261027'], false);
});
