import { defineConfig } from 'vite';

export default defineConfig({
  base: '/colorriffs/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
    },
  },
});
