import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist', // Output directory for built files
    assetsDir: 'assets', // Directory for assets like CSS
  },
  server: {
    port: 5173, // Default Vite dev server port
  },
});