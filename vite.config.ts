import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Inject environment variables at build time
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.RENDER_API_KEY': JSON.stringify(env.RENDER_API_KEY),
        'process.env.VERCEL_API_KEY': JSON.stringify(env.VERCEL_API_KEY),
        'process.env.NETLIFY_API_KEY': JSON.stringify(env.NETLIFY_API_KEY),
        'process.env.REPLIT_API_KEY': JSON.stringify(env.REPLIT_API_KEY),
        'process.env.GITHUB_PAT': JSON.stringify(env.GITHUB_PAT),
        'process.env.BROWSERLESS_API_KEY': JSON.stringify(env.BROWSERLESS_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'esnext',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          }
        },
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'editor': ['@monaco-editor/react'],
              'markdown': ['react-markdown'],
              'ai': ['@google/genai'],
            }
          }
        },
        chunkSizeWarningLimit: 1000,
      },
      optimizeDeps: {
        include: ['react', 'react-dom', '@google/genai', 'isomorphic-git']
      }
    };
});
