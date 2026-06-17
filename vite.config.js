import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          starfield: ['./src/components/starfield.js'],
          solar: ['./src/components/solarSystem.js'],
          planet: ['./src/components/planetRenderer.js'],
          quiz: ['./src/components/quiz.js'],
          calc: ['./src/components/calculator.js'],
        },
      },
    },
    minify: 'esbuild',
    sourcemap: false,
  },
  server: {
    port: 5173,
    open: true,
  },
  optimizeDeps: {
    include: [],
  },
});
