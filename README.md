# @x-ac/web-design-react-antd

基于 `@x-ac/web-design-react/kit` 的 **Ant Design 6** 适配包。

引擎（`@x-ac/web-design-core` / `@x-ac/web-design-react`）只提供架构：整合已注册的组件，形成设计器与渲染器。
本包只负责**注册组件与组件配置**，以及引擎自身 UI（属性设置面板等）所用的控件；
渲染器只消费组件、导出数据、派发事件，不含任何 UI 库知识。

## 安装

```bash
pnpm add @x-ac/web-design-react-antd antd dayjs
```

`@x-ac/web-design-core`、`@x-ac/web-design-react`、`react`、`react-dom` 为 peer 依赖。
`antd` 需 6.x（原生支持 React 19，`peerDependencies: react >=18`），**不需要**
`@ant-design/v5-patch-for-react-19`（那是 antd 5 的历史补丁）。

## 用法

```tsx
import { ReactDesignProvider, SchemaRenderer } from "@x-ac/web-design-react";
import { SchemaDesigner } from "@x-ac/web-design-react/designer";
import { antdAdapter, AntdConfigProvider } from "@x-ac/web-design-react-antd";
import "@x-ac/web-design-react/style.css";

// AntdConfigProvider 可选：让 message / Modal 走 App context，同步 ConfigProvider 主题。
// 不包裹也能工作，actions 会回落到 antd 静态 API。
export function App() {
  return (
    <AntdConfigProvider>
      <ReactDesignProvider adapter={antdAdapter}>
        {/* 渲染器：只消费组件 + 导出数据 + 派发事件 */}
        <SchemaRenderer page={page} data={data} onNodeEvent={logEvent} onSubmit={save} />
        {/* 设计器：属性面板、顶栏、物料面板全部使用 antd 控件 */}
        <SchemaDesigner pageId="p1" repository={repo} />
      </ReactDesignProvider>
    </AntdConfigProvider>
  );
}
```

### 导出

| 导出 | 说明 |
| --- | --- |
| `antdAdapter` | 组装好的 `UiAdapter`（components + materials + designer + actions + binding） |
| `ANTD_COMPONENTS` | `ec-*` → antd 组件映射表 |
| `antdMaterials` | core 通用清单 + antd 专有属性补丁 + 专有物料 |
| `antdDesignerKit` | 设计器 7 个槽位控件（Button/Input/NumberInput/Select/Switch/Segmented/ColorInput） |
| `antdActionAdapter` / `runActions` | 消息与确认框副作用 |
| `AntdConfigProvider` / `AntdAppBridge` / `setAntdAppContext` | 可选的 context 注入 |

### 关键点

- **按组件ID自动绑定**：未写 `modelValue` 的表单控件按 `form.<node.id>` 取值，宿主 `data` 的键必须是完整 node.id。
- **子表单**：`ec-subform` 由引擎按 `kind` 渲染，无需 UI 库组件实现；组内字段按 `form.<itemPath>[i].<id>` 绑定，理论上无限嵌套。
- **onChange 归一化**：渲染器把 `onChange` 的第一个参数写回 scope，所以本包所有控件都把 antd 的原生事件翻译成「值」（Input 取 `e.target.value`、DatePicker 取日期字符串、Checkbox.Group 取数组、Switch 取 boolean）。
- **物料覆盖齐全**：`missingComponents(antdAdapter)` 为 `[]`，设计器面板无置灰项（含 core 的业务语义物料 `ec-org-picker` / `ec-dict-select` / `ec-amount-input`）。
- 业务系统若有专用组织树 / 字典服务，用 `registerMaterials(antdAdapter, [...])` 覆盖同名实现即可。

## 本包自包含的完整示例

`example/` 是完整 React 实例，三个页签：

- **设计器**：拖拽搭建 Schema，属性面板（输入框 / 下拉 / 开关 / 取色）用 antd 控件配置；
- **渲染器**：消费同一份 Schema，实时展示 scope、事件派发与提交结果；
- **适配包清单**：可视化本包注册了哪些组件、物料、designer kit 槽位，
  以及 `missingComponents(antdAdapter)` 为空（设计器面板无置灰项），直观印证架构分层。

预置 Schema（`example/src/schema.ts`）覆盖 **core 全部 27 个协议物料 + 3 个 antd 专有物料**，
含两级嵌套子表单（订单 → 商品明细）、按组件ID自动绑定、必填校验，以及
`toast` / `setState` / `confirm` / `resetForm` / `submitForm` 真实动作链。
渲染器侧演示 `onEvent`（可阻断）、`onNodeEvent`（只读通知）、`onSubmit`（提交回调）、
`onDataChange`（scope 实时回传）与 `ref.getData()` 命令式导出。

```bash
pnpm install
pnpm dev            # http://127.0.0.1:5176
pnpm typecheck      # 库 + 示例两轮 tsc
pnpm test           # 12 个用例（适配包 + 示例 Schema 运行时冒烟）
pnpm build          # 库产物 dist/
pnpm verify:dist    # 库产物存在性/非空/d.ts 路径硬校验
pnpm build:example  # 示例站 example/dist/（base: /）
pnpm pages:build    # Pages 产物 pages-dist/（base: /web-design-react-antd/ + 零断链自检）
pnpm check          # 以上全部（含 verify:dist 与 pages:build）
```

示例通过 vite alias 直接消费 `src/`；引擎依赖 `@x-ac/web-design-core` / `@x-ac/web-design-react`
的已发布版本（`^1.0.0`，由 node_modules 解析），无需 checkout 上游 monorepo 源码。

### 构建分包

`example/vite.config.ts` 按变更频率拆 chunk（总字节不变，迭代更新时只重新下载变化的 chunk）：

| chunk | 内容 | 大小 (gzip) |
| --- | --- | --- |
| `index` | 适配包 + 示例业务代码 | 23.85 kB (8.55) |
| `engine` | 已发布的 @x-ac/web-design-core / @x-ac/web-design-react 依赖（node_modules） | 125.70 kB (39.39) |
| `vendor-antd` | antd + @rc-component + React 运行时 | 1,256.67 kB (399.13) |

> antd 的 pnpm 虚拟路径里含 `react@`，且 rolldown 会把 React 归入依赖它的 vendor chunk，
> 因此 React 运行时随 antd 一起进 `vendor-antd`，不单独拆 `vendor-react`。
> 若要把首屏压得更小，后续可对**非首屏的专有物料**（Cascader / ColorPicker / DatePicker 等）
> 做动态 import，而不是继续切 vendor。

## CI / 部署

工作流模式参考 `cn-xac/regex` 的 `.github/workflows/`，按本仓「独立适配包」布局调整。

| 工作流 | 触发 | 作用 |
| --- | --- | --- |
| `publish.yml` | push `v*` tag / 手动（默认 dry_run） | OIDC 可信发布到 npm（免 token，带 provenance） |
| `pages.yml` | push main / 手动 | 构建示例站并部署到 GitHub Pages |

**发布门禁**（`publish.yml`）：`install → build → verify-dist → typecheck & test →
tag 与 package.json 版本一致性 → pack 预览 → publish`。
手动触发默认 `dry_run=true`，只跑门禁 + `publish --dry-run`（除上传 registry 外做尽一切），
用来验证工作流本身；tag 触发则真发布。publish 带 `--ignore-scripts`（dist 已产出，
跳过 `prepack` 重复构建）、`--provenance`、`--no-git-checks`。

**Pages 门禁**（`pages.yml`）：`install → build → verify-dist → typecheck & test →
node tools/pages.mjs → configure-pages → upload artifact`。
`tools/pages.mjs` 复用 `example/vite.config.ts` 的 alias 与分包，用 vite build API 覆盖
`base=/<repo>/` 输出到 `pages-dist/`，并做**零断链自检**（绝对路径必须带 base 前缀、
引用的文件与 chunk 相对 import 必须真实存在）。`configure-pages` 带 `enablement: true`，
会自动把 Pages Source 切到 GitHub Actions。

两个工作流都把本仓库 checkout 到 `ext/`，依赖 `@x-ac/web-design-core` / `@x-ac/web-design-react`
的已发布版本（由 `ext/pnpm-lock.yaml` 锁定，npm 直接安装），不再 checkout 上游 monorepo 源码。
因 workspace 根没有 `package.json`，`pnpm/action-setup` 用 `package_json_file: ext/package.json`
读取 packageManager，`setup-node` 的缓存路径用 `ext/pnpm-lock.yaml`。

### 一次性前置条件（需仓库所有者操作）

1. **npm 可信发布**：npmjs.com 包设置 → Publishing access → Add a trusted publisher →
   GitHub Actions，填 `owner=cn-xac`、`repository=web-design-react-antd`、`Workflow=publish.yml`。
   - **Environment 名必须与 `publish.yml` 里的 `environment: npm` 一致**，
     并在 GitHub 仓库 Settings → Environments 里建同名 `npm` 环境；
     若 npm 侧登记的是别的名字，需同步改工作流里的 `environment`。
   - 可信发布者只能绑定到**已存在的包**：首版需先手工种一个占位版本（如 `0.0.0`），
     绑定 Trusted Publisher 后正式版本才由工作流接管。
2. **仓库改名后重登 Trusted Publisher**：npmjs 的 Trusted Publisher 绑定的是旧仓库名
   `design-react-antd`，改名 `web-design-react-antd` 后须到 npmjs 重新登记 `repository`
   字段，否则 `publish.yml` 的可信发布会因 subject 不匹配而失败。
3. **发布命令**：tag 由开发者本地按约定执行（`git tag -s v1.0.0 -m "release 1.0.0"` 后推送），
   工作流不建 tag、不 push。

> Pages 地址：`https://cn-xac.github.io/web-design-react-antd/`。
> `example/vite.config.ts` 始终保持 `base: '/'`（本地 dev / `build:example` 用），
> Pages 子路径由 `tools/pages.mjs` 依 `PAGES_REPO` 注入；仓库改名无需改脚本。

## 目录结构

```
src/
  index.tsx       组装 adapter 与导出
  components.tsx  ec-* → antd 组件（含 onChange 归一化）
  materials.ts    core 清单 + antd 补丁 + 专有物料
  designer.tsx    完整 designer kit（7 槽位）
  actions.ts      message / Modal.confirm
  app.tsx        可选的 App context 注入
  styles.css      最小补充样式
example/
  src/App.tsx        三页签主壳（设计器 / 渲染器 / 适配包清单）
  src/schema.ts      预置 PageSchema（全物料 + 嵌套子表单 + 动作链）与种子数据
  src/AdapterPanel.tsx  适配包注册清单可视化
  src/styles.css     示例布局与响应式样式
  vite.config.ts     alias + 分包策略（base 恒为 /）
tests/              12 个用例（适配包冒烟 + 示例 Schema 运行时冒烟）
tools/
  verify-dist.mjs   库产物硬校验（CI build 后立即跑）
  pages.mjs         Pages 构建 + 动态 base + 零断链自检
scripts/            构建前清理 dist
```
