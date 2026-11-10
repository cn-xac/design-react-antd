import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

/**
 * 适配包库模式构建：单入口，宿主依赖全部 external。
 * 产物只含「物料实现 + 绑定通道 + 动作副作用 + 设计器控件」，不含引擎与 antd 本体。
 */
export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: "./tsconfig.json",
      entryRoot: "src",
      include: ["src/**/*.ts", "src/**/*.tsx"],
      insertTypesEntry: false,
      copyDtsFiles: false,
      // tsconfig 的 paths 是本地联调用的（指向兄弟仓源码），
      // 不能让它被改写进 d.ts —— 产物里的模块说明符必须是包名
      pathsToAliases: false,
      beforeWriteFile: (filePath, content) => ({
        filePath,
        content: content.replace(
          /(?:\.\.\/)+[\w./-]*project\/packages\/(core|react)\/src([\w./-]*)/g,
          (_match, name: string, rest: string) =>
            `@x-ac/web-design-${name}${rest.startsWith("/kit") ? "/kit" : rest.startsWith("/designer") ? "/designer" : ""}`,
        ),
      }),
    }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.tsx", import.meta.url)),
      formats: ["es"],
    },
    sourcemap: true,
    emptyOutDir: false,
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        /^antd(\/|$)/,
        "@x-ac/web-design-core",
        "@x-ac/web-design-react",
        "@x-ac/web-design-react/kit",
        "@x-ac/web-design-react/designer",
      ],
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
