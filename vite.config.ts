import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Tradesapp',
        short_name: 'Tradesapp',
        description: 'Work logging for tradespeople - time, materials, travel, invoicing.',
        theme_color: '#0a0e27',
        background_color: '#0a0e27',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // Precache the built app shell so it loads with zero network - the whole
        // point of "offline-first" per ARCHITECTURE.md. IndexedDB data access was
        // already offline-capable; this is what makes the shell itself work too.
        globPatterns: ['**/*.{js,css,html,svg,ico,png}'],
      },
    }),
  ],
})
