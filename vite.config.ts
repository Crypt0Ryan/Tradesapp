import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png'],
      manifest: {
        name: 'Tradesapp',
        short_name: 'Tradesapp',
        description: 'Work logging for tradespeople - time, materials, travel, invoicing.',
        theme_color: '#182335',
        background_color: '#182335',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the built app shell so it loads with zero network - the whole
        // point of "offline-first" per ARCHITECTURE.md. IndexedDB data access was
        // already offline-capable; this is what makes the shell itself work too.
        // .woff (not .woff2) intentionally excluded - it's a same-font fallback
        // format modern browsers never use when .woff2 is available, so
        // precaching it would just be dead weight.
        globPatterns: ['**/*.{js,css,html,svg,ico,png,woff2}'],
      },
    }),
  ],
})
