import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/hubs": {
        target: "http://localhost:5160",
        changeOrigin: true,
        ws: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})
