import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * 示例站构建：本地 dev 走根路径，GitHub Pages 项目页按仓库名设子路径。
 * 本地布局 web-design/{project,design-react-antd} 与 CI 并排 checkout
 * （ext/ + project/）一致，故 ../../project 两边都能命中。
 */
const isPages = process.env.NODE_ENV === "production";

export default defineConfig({
  root: r("."),
  base: isPages ? "/design-react-antd/" : "/",
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "antd"],
    alias: [
      // 本包走源码，示例改动即刻生效，不依赖 dist
      { find: "@x-ac/design-react-antd", replacement: r("../src/index.tsx") },
      { find: "@x-ac/design-core", replacement: r("../../project/packages/core/src/index.ts") },
      // 顺序敏感：子路径必须先于包别名
      { find: "@x-ac/design-react/style.css", replacement: r("../../project/packages/react/src/styles.css") },
      { find: "@x-ac/design-react/kit", replacement: r("../../project/packages/react/src/kit.ts") },
      { find: "@x-ac/design-react/designer", replacement: r("../../project/packages/react/src/designer.ts") },
      { find: "@x-ac/design-react", replacement: r("../../project/packages/react/src/index.ts") },
    ],
  },
  build: {
    outDir: r("./dist"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
  },
  server: { port: 5176, host: "127.0.0.1" },
});
