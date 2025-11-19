import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // When building for GitHub Pages or another static host under a
      // sub‑path, Vite needs to know the base path at which the app will
      // be served.  Falling back to a relative base (`./`) ensures that
      // the built assets are referenced correctly regardless of where
      // they are hosted.  You can override this by defining VITE_BASE
      // in your environment, for example `/Thanit-Rachkul/` for GitHub
      // Pages deployments.
      // For GitHub Pages deployments the app is served from the repository
      // subpath.  Specify the repository name as the base so Vite
      // generates correct asset links.  If VITE_BASE is defined in the
      // environment it will override this default.
      base: env.VITE_BASE || '/Thanit-Rachkul/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Expose a backend URL for the client.  Default to the Render
        // deployment if not provided via VITE_BACKEND_URL in the
        // environment.  This allows the front‑end to communicate with
        // the backend without exposing the API key.
        'import.meta.env.VITE_BACKEND_URL': JSON.stringify(env.VITE_BACKEND_URL || 'https://thanit-rachkul.onrender.com'),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
