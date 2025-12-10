import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false, // We'll handle base styles ourselves
    }),
  ],
  output: 'static',
  publicDir: 'public',
  site: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  base: process.env.BASE_PATH || '/',
  vite: {
    define: {
      global: 'globalThis',
    },
    ssr: {
      noExternal: ['plotly.js-dist-min'],
    },
    build: {
      cssMinify: true,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            'plotly': ['plotly.js-dist-min'],
            'react-vendor': ['react', 'react-dom'],
          },
        },
      },
    },
  },
});

