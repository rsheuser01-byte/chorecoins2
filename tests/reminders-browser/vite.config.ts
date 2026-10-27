import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
export default defineConfig({
  root, envFile: false, envPrefix: [], plugins: [react()],
  resolve: { alias: [
    { find: '@/integrations/supabase/client', replacement: `${root}tests/reminders-browser/mock.ts` },
    { find: '@/services/reminderPreferencesApi', replacement: `${root}tests/reminders-browser/mock.ts` },
    { find: '@', replacement: `${root}src` },
  ] },
  server: { host: '127.0.0.1', port: 4179, strictPort: true },
});
