import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Bản click-là-chạy: gộp toàn bộ JS/CSS (+ worker inline) vào 1 file HTML duy nhất.
// Mở trực tiếp bằng double-click (file://) không cần serve, không cần Node/Apache/Nginx.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-single',
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 10_000,
    cssCodeSplit: false,
    rollupOptions: {
      // Gộp cả chunk lazy Scene3D vào 1 file để file:// không phải fetch thêm
      output: { inlineDynamicImports: true },
    },
  },
  test: { include: ['src/**/*.test.ts'] },
  worker: { format: 'es' },
});
