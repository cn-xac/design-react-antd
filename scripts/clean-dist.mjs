#!/usr/bin/env node
/** 构建前清空 dist（跨平台、不受 shell 限制），避免发布时混入旧 chunk。 */
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const target = resolve(process.cwd(), process.argv[2] ?? "dist");
if (!target.includes("dist")) {
  console.error(`拒绝删除非 dist 目录：${target}`);
  process.exit(1);
}
if (existsSync(target)) rmSync(target, { recursive: true, force: true });
console.log(`[clean] 已清空 ${target}`);
