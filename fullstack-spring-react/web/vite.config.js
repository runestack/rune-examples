import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Local dev: proxy API calls to a locally running notes-api.
    // In production nginx does this (see nginx.conf).
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
