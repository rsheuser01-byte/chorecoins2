import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
export default defineConfig({
  root, envFile: false, envPrefix: [], plugins: [react()],
  // Test both missing flag and unexpected true; neither bypasses production lock.
  define: process.env.LOCAL_TEST_CLOUD_VALUE ? { 'import.meta.env.VITE_CLOUD_SYNC_ENABLED': JSON.stringify(process.env.LOCAL_TEST_CLOUD_VALUE) } : {},
  resolve: { alias: [
    { find: '@/integrations/supabase/client', replacement: `${root}tests/browser/supabase-mock.ts` },
    { find: '@/services/accountProgressApi', replacement: `${root}tests/local-browser/cloud-forbidden.ts` },
    { find: '@', replacement: `${root}src` },
  ] },
  server: { host: '127.0.0.1', port: 4179, strictPort: true },
});
