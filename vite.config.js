import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild', // Enable minification
    sourcemap: true, // Generate sourcemaps for debugging
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['node_modules'] // Split vendor code
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true,
    define: {'import.meta.env.VITE_API_BASE': JSON.stringify(process.env.VITE_API_BASE || 'https://exercise1-nt4i.onrender.com')}
  }
});