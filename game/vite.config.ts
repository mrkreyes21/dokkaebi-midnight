import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './', // Crucial for Facebook Instant Games relative asset loading
  envDir: path.resolve(__dirname, '..'), // Load VITE_* from monorepo root .env
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
