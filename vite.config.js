import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'nutrition',
    emptyOutDir: true,
    rollupOptions: {
      input: 'nutrition.html'
    }
  }
});
