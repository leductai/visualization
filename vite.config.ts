import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  // './' để bản serve chạy được cả ở domain root, sub-folder, Apache/Nginx
  base: './',
  plugins: [react()],
  build: { outDir: 'dist' },
  test: { include: ['src/**/*.test.ts'] },
});
