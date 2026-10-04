import { defineConfig } from 'vitest/config';

export default defineConfig({
  // 允许构建产物部署在 /skyfire/ 等子目录下。
  base: './',
  server: {
    // 允许 Cloudflare Tunnel 使用指定的开发域名访问。
    allowedHosts: ['dev.riverxutools.com'],
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
