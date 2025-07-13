import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Node.js polyfills for browser compatibility
      buffer: 'buffer',
      events: 'events',
      util: 'util',
      stream: 'stream-browserify',
      crypto: 'crypto-browserify',
    },
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
  },
  preview: {
    port: 3000,
    host: true,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['axios'],
        },
      },
    },
  },
  define: {
    // Define global for Node.js compatibility
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      'buffer', 
      'events', 
      'util', 
      'stream-browserify',
      'crypto-browserify',
      'circomlibjs'
    ],
    exclude: [],
  },
})
