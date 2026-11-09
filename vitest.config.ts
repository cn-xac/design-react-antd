import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * 扩展仓用例配置：把核心仓 / react 引擎仓源码直接挂到别名上，
 * 两仓并排开发时改完即刻生效，不依赖对方是否已构建 dist。
 * 顺序敏感：子路径必须先于包别名，否则会被拼成 index.ts/kit。
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "antd"],
    alias: [
      { find: "@x-ac/design-react-antd", replacement: r("./src/index.tsx") },
      { find: "@x-ac/design-core", replacement: r("../project/packages/core/src/index.ts") },
      { find: "@x-ac/design-react/kit", replacement: r("../project/packages/react/src/kit.ts") },
      { find: "@x-ac/design-react/designer", replacement: r("../project/packages/react/src/designer.ts") },
      { find: "@x-ac/design-react", replacement: r("../project/packages/react/src/index.ts") },
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
