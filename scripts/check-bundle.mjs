import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const forbidden = [
  'PRIVATE_DB_SENTINEL_NOT_A_CREDENTIAL',
  'PRIVATE_PLAID_SENTINEL_NOT_A_CREDENTIAL',
  'PRIVATE_ARTIFACT_SENTINEL_NOT_A_CREDENTIAL',
  'PRIVATE_ENV_SENTINEL_NOT_A_CREDENTIAL',
  'VITE_NEON_DATABASE_URL', 'VERCEL_ARTIFACTS_TOKEN', 'VERCEL_ENV_ENC_KEY',
  'VERCEL_ENCRYPTED_ENV_CONTENT', 'PLAID_SECRET', 'ENCRYPTION_KEY',
];
let inspected = 0;
function inspect(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) inspect(path);
    else if (/\.(js|css|html|map|json)$/.test(name)) {
      inspected += 1;
      const content = readFileSync(path, 'utf8');
      if (forbidden.some(value => content.includes(value))) {
        // Report only the file, never matching content or secret values.
        throw new Error(`Private build environment detected in ${path}`);
      }
    }
  }
}
inspect('dist');
if (!inspected) throw new Error('No generated assets found to inspect');
console.log(`Scanned ${inspected} generated text assets: no private sentinels or forbidden variable names.`);
