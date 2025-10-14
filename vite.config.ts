import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      //Redirects API requests to the server
      '/api': {
        target: 'http://localhost:34200', // Server URL for development
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
