import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const host = process.env.TAURI_DEV_HOST;
const srcPath = path.resolve(__dirname, './src');

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': srcPath,
      '@assets': path.resolve(srcPath, './assets'),
      '@components': path.resolve(srcPath, './components'),
      '@interfaces': path.resolve(srcPath, './data/interfaces'),
      '@objects': path.resolve(srcPath, './data/objects'),
      '@utils': path.resolve(srcPath, './utils'),
      '@pages': path.resolve(srcPath, './pages'),
      '@redux': path.resolve(srcPath, './redux'),
      '@data': path.resolve(srcPath, './data'),
      components: path.resolve(srcPath, './components'),
      data: path.resolve(srcPath, './data'),
      features: path.resolve(srcPath, './features'),
      helpers: path.resolve(srcPath, './helpers'),
      layouts: path.resolve(srcPath, './layouts'),
      lib: path.resolve(srcPath, './lib'),
      localization: path.resolve(srcPath, './localization'),
      pages: path.resolve(srcPath, './pages'),
      routes: path.resolve(srcPath, './routes'),
      styles: path.resolve(srcPath, './styles'),
      utils: path.resolve(srcPath, './utils'),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: 'ws',
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
}));
