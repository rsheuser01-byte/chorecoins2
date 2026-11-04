import { build } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'node:url';
import { rename } from 'node:fs/promises';
const root = fileURLToPath(new URL('../', import.meta.url));
await build({
  root,
  configFile: false,
  envFile: false,
  envPrefix: [],
  plugins: [react()],
  resolve: { alias: { '@': `${root}src` } },
  build: { rollupOptions: { input: `${root}prototype.html` } },
});
await rename(`${root}dist/prototype.html`, `${root}dist/index.html`);
