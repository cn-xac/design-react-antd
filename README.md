# @x-ac/design-react-antd

基于 `@x-ac/design-react/kit` 的 **Ant Design 6** 适配包。

引擎（`@x-ac/design-core` / `@x-ac/design-react`）只提供架构：整合已注册的组件，形成设计器与渲染器。
本包只负责**注册组件与组件配置**，以及引擎自身 UI（属性设置面板等）所用的控件；
渲染器只消费组件、导出数据、派发事件，不含任何 UI 库知识。

## 安装

```bash
pnpm add @x-ac/design-react-antd antd dayjs
```

`@x-ac/design-core`、`@x-ac/design-react`、`react`、`react-dom` 为 peer 依赖。
`antd` 需 6.x（原生支持 React 19，`peerDependencies: react >=18`），**不需要**
`@ant-design/v5-patch-for-react-19`（那是 antd 5 的历史补丁）。

## 用法

```tsx
import { ReactDesignProvider, SchemaRenderer } from "@x-ac/design-react";
import { SchemaDesigner } from "@x-ac/design-react/designer";
import { antdAdapter, AntdConfigProvider } from "@x-ac/design-react-antd";
import "@x-ac/design-react/style.css";

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
pnpm build:example  # 示例站 example/dist/
pnpm check          # 以上全部
```

示例通过 vite alias 直接消费 `src/` 与兄弟仓 `../project/packages/{core,react}/src` 源码，
改完即刻生效，不依赖任何一方的 `dist`。

### 构建分包

`example/vite.config.ts` 按变更频率拆 chunk（总字节不变，迭代更新时只重新下载变化的 chunk）：

| chunk | 内容 | 大小 (gzip) |
| --- | --- | --- |
| `index` | 适配包 + 示例业务代码 | 23.85 kB (8.55) |
| `engine` | 兄弟仓 core / react 引擎源码 | 123.98 kB (39.22) |
| `vendor-antd` | antd + @rc-component + React 运行时 | 1,256.67 kB (399.13) |

> antd 的 pnpm 虚拟路径里含 `react@`，且 rolldown 会把 React 归入依赖它的 vendor chunk，
> 因此 React 运行时随 antd 一起进 `vendor-antd`，不单独拆 `vendor-react`。
> 若要把首屏压得更小，后续可对**非首屏的专有物料**（Cascader / ColorPicker / DatePicker 等）
> 做动态 import，而不是继续切 vendor。

## CI / 部署

| 工作流 | 触发 | 作用 |
| --- | --- | --- |
| `.github/workflows/publish.yml` | push `v*` tag 或手动 | OIDC 可信发布到 npm（免 token，带 provenance） |
| `.github/workflows/pages.yml` | push main 或手动 | 构建 `example/` 并部署到 GitHub Pages |

两个工作流都把本仓库 checkout 到 `ext/`、把 `cn-xac/web-desgin` checkout 到 `project/`，
以解析 devDependencies 里的 `link:../project/packages/*`（本地也是同样的并排布局）。

### 一次性前置条件（需仓库所有者操作）

1. **npm 可信发布**：npmjs.com 包设置 → Publishing access → Add a trusted publisher →
   GitHub Actions，填 `owner=cn-xac`、`repository=design-react-antd`、`Workflow=publish.yml`。
   首次发布前需先在 npm 创建/认领 `@x-ac/design-react-antd`（scope 已持有）。
2. **GitHub Pages**：仓库 Settings → Pages → Source = **GitHub Actions**。
3. **依赖仓库可见性**：若 `cn-xac/web-desgin` 为私有仓库，需在两个工作流里给
   monorepo checkout 加 `token: ${{ secrets.CI_MONOREPO_PAT }}`（文件内已留注释）。
4. **发布命令**：tag 由开发者本地按约定执行，工作流不建 tag、不 push。

> Pages 地址：`https://cn-xac.github.io/design-react-antd/`。
> `example/vite.config.ts` 在 `NODE_ENV=production` 时自动把 base 设为 `/design-react-antd/`，
> dev 仍为 `/`；若仓库改名，需同步该 base。

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
  vite.config.ts     alias + Pages base + 分包策略
tests/              12 个用例（适配包冒烟 + 示例 Schema 运行时冒烟）
scripts/            构建前清理 dist
```
