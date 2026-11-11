#!/usr/bin/env node
/**
 * GitHub Pages 构建脚本 —— 只在 CI 里跑（本地也可手动彩排）。
 *
 * 与 cn-xac/regex 的 tools/pages.mjs 同一思路：dev 配置保持 base: '/',
 * Pages 挂在 /<repo>/ 子路径下，由本脚本用 vite 的 build API 在内存里覆盖 base，
 * 输出到独立的 pages-dist/，然后做零断链自检。
 *
 * 差异：regex 用 configFile:false 自己拼 plugins/alias；本仓库 example/vite.config.ts
 * 里的 alias 指向兄弟仓源码、还有 manualChunks 分包规则，重复一遍必然漂移。
 * 因此这里 **加载同一份 configFile**，只覆盖 base 与 outDir，alias/分包仍是单一事实来源。
 *
 * 零断链自检：
 * 1) index.html 里所有以 / 开头的 href/src，必须以 /${REPO}/ 开头；
 * 2) 每条引用指向的静态文件都要在 pages-dist/ 里真实存在；
 * 3) chunk 之间的相对 import 目标也必须存在（避免只校验 html 漏掉 js 断链）。
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const configFile = resolve(repoRoot, "example/vite.config.ts");
const outDir = resolve(repoRoot, "pages-dist");

const REPO = process.env.PAGES_REPO || "web-design-react-antd";
const BASE = `/${REPO}/`;

console.log(`[pages] base    = ${BASE}（覆盖 example/vite.config.ts 的 '/'）`);
console.log(`[pages] config  = ${relative(repoRoot, configFile)}（复用 alias 与分包）`);
console.log(`[pages] outDir  = ${relative(repoRoot, outDir)}`);

await build({
  configFile,
  base: BASE,
  build: {
    outDir,
    emptyOutDir: true,
  },
  logLevel: "info",
});

const indexPath = join(outDir, "index.html");
if (!existsSync(indexPath)) {
  console.error("[pages] 断链：pages-dist/index.html 未生成");
  process.exit(1);
}

const html = readFileSync(indexPath, "utf8");
const absRefs = [...html.matchAll(/(?:href|src)="(\/[^"]+)"/g)].map((m) => m[1]);

const wrongPrefix = absRefs.filter((ref) => ref !== "/" && !ref.startsWith(BASE));
if (wrongPrefix.length) {
  console.error("[pages] 断链：index.html 里有绝对路径没带 base 前缀：");
  for (const ref of wrongPrefix) console.error("  -", ref);
  process.exit(1);
}

const missing = [];
let checked = 0;
for (const ref of absRefs) {
  const rel = ref.startsWith(BASE) ? ref.slice(BASE.length) : "";
  const path = rel.split("?")[0].split("#")[0];
  if (!path) continue;
  const file = join(outDir, path);
  if (!existsSync(file) || !statSync(file).isFile()) missing.push(ref);
  else checked++;
}

// chunk 之间的相对 import：扫所有 js，校验 ./xxx.js 目标存在
const assetsDir = join(outDir, "assets");
const jsFiles = existsSync(assetsDir)
  ? readdirSync(assetsDir).filter((f) => f.endsWith(".js")).map((f) => join(assetsDir, f))
  : [];
for (const js of jsFiles) {
  const text = readFileSync(js, "utf8");
  for (const m of text.matchAll(/from\s*"\.\/([^"]+)"/g)) {
    const target = join(assetsDir, m[1].split("?")[0]);
    if (!existsSync(target)) missing.push(`${relative(repoRoot, js)} -> ./${m[1]}`);
    else checked++;
  }
}

if (missing.length) {
  console.error("[pages] 断链：引用了但 pages-dist/ 里不存在的文件：");
  for (const m of missing) console.error("  -", m);
  process.exit(1);
}

console.log(
  `[pages] 构建完成：index.html + ${jsFiles.length} 个 js chunk；` +
    `零断链自检 ${checked} 条引用全部命中（BASE=${BASE}）`,
);
