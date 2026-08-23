import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon_src.png', 'yakshavahini.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'ಯಕ್ಷವಾಹಿನಿ — Yakshavahini',
        short_name: 'ಯಕ್ಷವಾಹಿನಿ',
        description: 'Yakshagana resource catalog — Mattukosha, Pustaka Kosha, Sanghatana Kosha',
        start_url: '/',
        display: 'standalone',
        background_color: '#faf7f2',
        theme_color: '#9a0000',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache the app shell only — entry data always goes over the
        // network (api.ts hits the Django backend directly), so there's
        // no risk of the service worker serving stale catalog content.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
