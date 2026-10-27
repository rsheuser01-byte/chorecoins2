import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

process.env.BROWSERSLIST_IGNORE_OLD_DATA = "true";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Expose only these public browser settings, never the build process environment.
  envPrefix: [],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY || ''),
    'import.meta.env.VITE_CLOUD_SYNC_ENABLED': JSON.stringify(env.VITE_CLOUD_SYNC_ENABLED === 'true' ? 'true' : 'false'),
    'import.meta.env.VITE_PLAID_MOCK_MODE': JSON.stringify(env.VITE_PLAID_MOCK_MODE || 'true'),
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
});

