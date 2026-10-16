/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // We register the worker ourselves (src/pwa/update.ts) so updates apply reliably.
      injectRegister: false,
      // Icons are drawn by design/render_icons.py (green "Start" play button).
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'],
      manifest: {
        name: 'Move With Elli',
        short_name: 'Move',
        description: 'Press Play. Don\'t Think. Move.',
        theme_color: '#eef1f6',
        background_color: '#eef1f6',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // A new version takes over straight away; src/pwa/update.ts then reloads into it
      // (never mid-workout). Needed explicitly because we register the worker ourselves.
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], skipWaiting: true, clientsClaim: true },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
