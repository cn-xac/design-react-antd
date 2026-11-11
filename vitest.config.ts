import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * 扩展仓用例配置：引擎依赖 @x-ac/web-design-core / @x-ac/web-design-react
 * 的已发布版本（^1.0.0），由 node_modules 解析；本包自身走源码别名。
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "antd"],
    alias: [
      { find: "@x-ac/web-design-react-antd", replacement: r("./src/index.tsx") },
    ],
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.spec.tsx", "tests/**/*.spec.ts"],
    setupFiles: ["tests/setup.ts"],
    pool: "forks",
    fileParallelism: false,
    fsModuleCache: false,
  },
});
