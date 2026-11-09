#!/usr/bin/env node
/**
 * 库产物存在性自检 —— CI 在 `pnpm build` 之后立刻跑，本地也可手动跑。
 *
 * 为什么需要它：vite build / pnpm 脚本在入口写错、filter 空跑等情况下
 * 可能「命令退出码 0，但 dist 里没有东西」，随后 publish 会发出一个空包，
 * 或 Pages 拿到旧依赖白屏。这里用「产物必须存在且非空」把假绿灯变成硬失败。
 *
 * 用法：node tools/verify-dist.mjs [rootDir]
 *   rootDir 默认 = 仓库根；传别的目录仅用于本地彩排失败分支。
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(process.argv[2] ?? resolve(here, ".."));
const dist = join(repoRoot, "dist");

/** 库产物必须产出的文件（对齐 vite.config.ts 的 lib + dts 约定） */
const REQUIRED = ["index.js", "index.d.ts"];

const problems = [];
let checked = 0;
let totalBytes = 0;

console.log(`[verify-dist] root = ${repoRoot}`);

for (const name of REQUIRED) {
  const abs = join(dist, name);
  const label = `dist/${name}`;
  try {
    const st = statSync(abs);
    if (!st.isFile()) {
      problems.push(`${label} : 不是普通文件`);
      continue;
    }
    if (st.size === 0) {
      problems.push(`${label} : 0 字节（空产物）`);
      continue;
    }
    checked++;
    totalBytes += st.size;
    console.log(`[verify-dist] ok      ${label.padEnd(28)} ${st.size} B`);
  } catch {
    problems.push(`${label} : 缺失（build 未产出该文件）`);
  }
}

/** 声明文件与样式：至少各有一份，且全部非空（d.ts 里残留相对路径会在下面单独查） */
if (!existsSync(dist)) {
  problems.push("dist/ : 目录不存在");
} else {
  const files = readdirSync(dist);
  const dts = files.filter((f) => f.endsWith(".d.ts"));
  const css = files.filter((f) => f.endsWith(".css"));
  if (dts.length < 2) problems.push(`dist/ : 声明文件只有 ${dts.length} 个（src 下多个模块应各自产出 .d.ts）`);
  if (css.length < 1) problems.push("dist/ : 缺少样式产物（src/styles.css 未被打包）");
  for (const f of [...dts, ...css]) {
    const st = statSync(join(dist, f));
    if (st.size === 0) problems.push(`dist/${f} : 0 字节（空产物）`);
  }
  console.log(`[verify-dist] info    ${dts.length} 个 .d.ts，${css.length} 个 .css`);
}

/** d.ts 里不能残留指向兄弟仓源码的相对路径，否则发布后消费者无法解析类型 */
for (const f of existsSync(dist) ? readdirSync(dist).filter((x) => x.endsWith(".d.ts")) : []) {
  const text = readFileSync(join(dist, f), "utf8");
  if (/\.\.\/project\/packages/.test(text)) problems.push(`dist/${f} : 残留 ../project 相对路径（应改写为包名）`);
}

if (problems.length) {
  console.error(`[verify-dist] 失败：${problems.length} 项不达标（已通过 ${checked}/${REQUIRED.length} 个必需文件）`);
  for (const p of problems) console.error(`[verify-dist]   - ${p}`);
  console.error("[verify-dist] 多半是 `pnpm build` 空跑或 dts 改写规则失效。");
  process.exit(1);
}

console.log(`[verify-dist] 通过：${checked} 个必需产物全部存在且非空，合计 ${totalBytes} B`);
