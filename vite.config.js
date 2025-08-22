import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    sourcemap: true,
  },
  server: {
    port: 5173,
    open: true,
    define: {
      'import.meta.env.VITE_API_BASE': JSON.stringify(
        process.env.VITE_API_BASE || 'https://exercise1-nt4i.onrender.com'
      ),
    },
  },
});