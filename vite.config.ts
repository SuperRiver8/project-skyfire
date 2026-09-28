import { defineConfig } from 'vitest/config';

export default defineConfig({
  // 允许构建产物部署在 /skyfire/ 等子目录下。
  base: './',
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
