import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * 扩展仓用例配置：引擎依赖 @x-ac/web-design-core / @x-ac/web-design-react。
 *
 * 默认（生产 / CI）走 node_modules 里的已发布版本（^1.0.0）；
 * 本地验证「core 新增 row/col、react 引擎 wrapperPassthrough」时，
 * 通过下面四条别名把核心 / 引擎也指向源码，免去先 build + 发布的步骤。
 * 验证已发布契约时请移除这四条别名。
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "antd"],
    alias: [
      { find: "@x-ac/web-design-react-antd", replacement: r("./src/index.tsx") },
      // 本地验证用：核心 / React 引擎走源码。顺序敏感：子路径必须先于包别名。
      { find: "@x-ac/web-design-core", replacement: r("../project/packages/core/src/index.ts") },
      { find: "@x-ac/web-design-react/kit", replacement: r("../project/packages/react/src/kit.ts") },
      { find: "@x-ac/web-design-react/designer", replacement: r("../project/packages/react/src/designer.ts") },
      { find: "@x-ac/web-design-react", replacement: r("../project/packages/react/src/index.ts") },
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
