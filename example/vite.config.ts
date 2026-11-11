import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * 示例站构建：本配置始终保持 base: '/'（本地 dev / build:example 都用根路径）。
 * GitHub Pages 项目页的 /<repo>/ 子路径由 tools/pages.mjs 用 vite build API 覆盖，
 * 避免把部署环境判断塞进 dev 配置。alias 与分包是本文件单一事实来源，pages.mjs 复用之。
 * 引擎依赖 @x-ac/web-design-core / @x-ac/web-design-react 的已发布版本（^1.0.0），由 node_modules 解析。
 */
export default defineConfig({
  root: r("."),
  base: "/",
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "antd"],
    alias: [
      // 本包走源码，示例改动即刻生效，不依赖 dist
      { find: "@x-ac/web-design-react-antd", replacement: r("../src/index.tsx") },
    ],
  },
  build: {
    outDir: r("./dist"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        /**
         * 按「变更频率」拆包，而不是盲目切成一堆小文件：
         * - vendor-antd：antd + @rc-component + React 运行时（rolldown 会把 React 归入
         *   依赖它的 vendor chunk，且 antd 的 pnpm 虚拟路径里也含 react@，无法干净拆分），
         *   几乎不变，浏览器可长期缓存；
         * - engine：已发布的 @x-ac/web-design-core / @x-ac/web-design-react 依赖（node_modules），随引擎发版变化；
         * - 入口 chunk：适配包 + 示例业务代码，改动后只失效这一部分（约 24 kB）。
         * 总字节不变，但迭代更新时只需重新下载变化的 chunk。
         */
        manualChunks(id) {
          if (id.includes("node_modules/.pnpm/antd@") || id.includes("/antd/es/") || id.includes("/@rc-component/")) return "vendor-antd";
          if (id.includes("node_modules/@x-ac/web-design-")) return "engine";
          return undefined;
        },
      },
    },
  },
  server: { port: 5176, host: "127.0.0.1" },
});
