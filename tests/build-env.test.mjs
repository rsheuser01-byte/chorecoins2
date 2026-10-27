import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('Vite config explicitly includes public settings and excludes synthetic private build environment', () => {
  const source = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '')
    .replace('export default ', 'globalThis.configFactory = ');
  const synthetic = {
    VITE_SUPABASE_URL: 'https://example.invalid', VITE_SUPABASE_PUBLISHABLE_KEY: 'public-test',
    VITE_PLAID_MOCK_MODE: 'true', VITE_NEON_DATABASE_URL: 'PRIVATE_DB_SENTINEL',
    VERCEL_ARTIFACTS_TOKEN: 'PRIVATE_TOKEN_SENTINEL', PLAID_SECRET: 'PRIVATE_PLAID_SENTINEL',
  };
  const context = { defineConfig: x => x, loadEnv: () => synthetic, react: () => ({}), componentTagger: () => ({}), path: { resolve: () => '/synthetic/src' }, __dirname: '/synthetic', process: { env: { ...synthetic }, cwd: () => '/synthetic' } };
  vm.createContext(context); vm.runInContext(source, context);
  const config = context.configFactory({ mode: 'production' });
  assert.equal(config.envPrefix.length, 0);
  assert.deepEqual(Object.keys(config.define).sort(), ['import.meta.env.VITE_PLAID_MOCK_MODE', 'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY', 'import.meta.env.VITE_SUPABASE_URL']);
  assert.ok(!JSON.stringify(config).includes('PRIVATE_'));
  assert.equal(JSON.parse(config.define['import.meta.env.VITE_SUPABASE_URL']), synthetic.VITE_SUPABASE_URL);
});
