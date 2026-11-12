# @x-ac/web-design-react-antd

基于 [Ant Design 6](https://ant.design/) 的 **Schema 驱动页面 / 表单** React 适配包。

引擎（`@x-ac/web-design-core` / `@x-ac/web-design-react`）只提供架构：把已注册的组件整合成「设计器」与「渲染器」。
**本包只做一件事**——把引擎约定的 30 个协议物料（`ec-*`）落地成 antd 组件，并补上设计器属性面板、消息/确认框等宿主能力。
你给它一份 JSON（`PageSchema`），它就画出一份用 antd 渲染、能收集数据、能派发事件的真实页面。

> 在线示例（设计器 / 渲染器 / 组件实例 / 适配包清单 四个页签）：
> https://cn-xac.github.io/web-design-react-antd/

> **面向 AI / 编码助手的说明**：本仓库根目录的 [`AGENTS.md`](./AGENTS.md)
> 是一份机器可读的精确参考（物料目录、Schema 结构、数据绑定契约、内置动作、React API 精确签名、可复制最小示例）。
> 当你需要调用本包实现页面 / 表单时，**请先读取 `AGENTS.md`** 再动手，可避免臆造 API 或写错物料 ID。

---

## 60 秒读懂

- 你**不写**任何 UI 组件代码，只描述「页面长什么样」（`PageSchema`）。
- 本包把 `ec-input`、`ec-table`、`ec-button` 等协议名翻译成 antd 组件。
- 表单数据自动按节点 `id` 绑定到 `form.<id>`，无需手写 `onChange`。
- 想做低代码搭建？直接挂上 `SchemaDesigner`，它和 `SchemaRenderer` 共用同一份 Schema。

---

## 安装

```bash
pnpm add @x-ac/web-design-react-antd antd dayjs
# 或
npm i @x-ac/web-design-react-antd antd dayjs
```

`@x-ac/web-design-core`、`@x-ac/web-design-react`、`react`、`react-dom` 为 **peer 依赖**，
npm ≥ 7 / pnpm ≥ 8 会**自动安装** peer，通常无需手动添加（yarn v1 例外，需手动装）。

**antd 需 6.x**：antd 6 原生支持 React 19（`peerDependencies: react >=18`），
**不需要** `@ant-design/v5-patch-for-react-19`（那是 antd 5 的历史补丁）。

---

## 用法一：只用渲染器（最简）

一份 `PageSchema` 喂给 `SchemaRenderer`，即得到一个可交互、可收集数据的 antd 页面。

```tsx
import { ReactDesignProvider, SchemaRenderer } from "@x-ac/web-design-react";
import { antdAdapter } from "@x-ac/web-design-react-antd";
import "@x-ac/web-design-react/style.css";

// 这就是「页面长什么样」——纯数据，可来自后端 / 设计器导出
const page = {
  schemaVersion: "1.0.0",
  id: "p1",
  type: "page",
  children: [
    { id: "name", component: "ec-input", props: { label: "姓名", placeholder: "请输入姓名" } },
    { id: "dept", component: "ec-select", props: { label: "部门", options: "技术中心,产品中心,设计中心" } },
    {
      id: "submit",
      component: "ec-button",
      props: { text: "提交", type: "primary" },
      // 点击触发动作（内置 toast / setState / submitForm / confirm / navigate）
      events: {
        click: [{ action: "toast", args: { text: "提交成功", type: "success" } }],
      },
    },
  ],
};

export function App() {
  return (
    <ReactDesignProvider adapter={antdAdapter}>
      {/* data 是初始数据；键必须是 form.<节点id> */}
      <SchemaRenderer
        page={page}
        data={{ form: { name: "张三", dept: "技术中心" } }}
        onSubmit={(result) => console.log("提交数据", result)}
      />
    </ReactDesignProvider>
  );
}
```

> 关键点：**表单控件默认按 `id` 自动绑定**，初始数据写在 `data.form.<id>`；
> 点击「提交」会校验并触发 `onSubmit`，拿到按绑定路径还原好的嵌套对象。

---

## 用法二：设计器 + 渲染器（共享同一份 Schema）

设计器搭建的 Schema 存进「页面仓储」，渲染器从仓储读取并实时渲染——
这就是低代码「搭完即所见」的完整闭环。

```tsx
import { useMemo, useState } from "react";
import { createMemoryRepository } from "@x-ac/web-design-core";
import { ReactDesignProvider, SchemaRenderer } from "@x-ac/web-design-react";
import { SchemaDesigner } from "@x-ac/web-design-react/designer";
import { antdAdapter, AntdConfigProvider } from "@x-ac/web-design-react-antd";
import "@x-ac/web-design-react/style.css";

const PAGE_ID = "demo";

export function App() {
  const repository = useMemo(() => createMemoryRepository(), []);
  const [schema, setSchema] = useState(null);

  // 设计器保存后，把仓储里的最新 Schema（注意取 .schema）交给渲染器
  const reloadSchema = () => {
    const record = repository.get(PAGE_ID);
    if (record) setSchema(record.schema);
  };

  return (
    <AntdConfigProvider>
      <ReactDesignProvider adapter={antdAdapter}>
        {/* 设计器：属性面板 / 物料面板 / 顶栏全是 antd 组件 */}
        <SchemaDesigner
          pageId={PAGE_ID}
          repository={repository}
          onSaved={reloadSchema}
          onPreview={() => console.log("切到渲染器页签预览")}
        />
        {/* 渲染器：消费同一份 Schema */}
        {schema && <SchemaRenderer page={schema} data={{ form: {} }} />}
      </ReactDesignProvider>
    </AntdConfigProvider>
  );
}
```

`AntdConfigProvider` 可选：让消息 / 确认框走 antd 的 `<App>` context（主题同步）。
不包裹也能工作，动作会自动回落到 antd 静态 API。

---

## 你能用到什么

### 物料清单（30 个，全部可渲染，无置灰项）

设计器面板里每个物料都能直接用；`missingComponents(antdAdapter)` 恒为 `[]`。

| 分类 | 协议名 `ec-*` | 中文 | 映射 antd | 关键 props |
| --- | --- | --- | --- | --- |
| 布局 | `container` | 容器 | `div` | `padding`, `onClick` |
| 布局 | `grid` | 栅格 | CSS Grid | `columns`(列数) |
| 布局 | `card` | 卡片 | `Card` | `title`, `extra` |
| 布局 | `space` | 间距组 | `Space` | — |
| 展示 | `title` | 标题 | `Typography.Title` | `text`, `level`(1-5) |
| 展示 | `text` | 文本 | `Typography.Paragraph` | `text`(支持 `{{expr}}`) |
| 展示 | `divider` | 分割线 | `Divider` | `text`, `dashed` |
| 展示 | `tag` | 标签 | `Tag` | `text`, `color` |
| 展示 | `alert` | 提示条 | `Alert` | `type`(info/success/warning/error), `message`, `description` |
| 展示 | `image` | 图片 | `Image` | `src`, `alt`, `width`, `height`（空 `src` 显示占位） |
| 展示 | `table` | 表格 | `Table` | `columns`(`[{label,prop}]`), `data`/`rows`, `emptyText` |
| 表单 | `input` | 输入框 | `Input` | `label`, `placeholder`, `maxlength`, `showCount`, `clearable`, `type` |
| 表单 | `textarea` | 多行文本 | `Input.TextArea` | `label`, `rows`, `showCount` |
| 表单 | `number` | 数字输入 | `InputNumber` | `label`, `min`, `max`, `precision`, `step` |
| 表单 | `select` | 下拉选择 | `Select` | `label`, `options`, `placeholder`, `clearable`, `showSearch`, `mode`(single/multiple/tags) |
| 表单 | `radio` | 单选框 | `Radio.Group` | `label`, `options` |
| 表单 | `checkbox` | 多选框 | `Checkbox.Group` | `label`, `options` |
| 表单 | `switch` | 开关 | `Switch` | `label`, `activeText`, `inactiveText` |
| 表单 | `date` | 日期选择 | `DatePicker` | `label`, `type`(date/month/daterange/datetime), `valueFormat` |
| 表单 | `rate` | 评分 | `Rate` | `label`, `count`, `allowHalf` |
| 表单 | `slider` | 滑块 | `Slider` | `label`, `min`, `max`, `step` |
| 表单 | `org-picker` | 组织选择 | `Input`(只读占位) | `label`, `placeholder` |
| 表单 | `dict-select` | 字典下拉 | `Select` | `label`, `options`, `dictKey`, `clearable` |
| 表单 | `amount-input` | 金额输入 | `InputNumber`(¥) | `label`, `currency`, `precision`, `min`, `max` |
| 表单 | `segmented` | 分段控制 | `Segmented` | `label`, `options` |
| 表单 | `color` | 颜色选择 | `ColorPicker` | `label`, `showAlpha` |
| 表单 | `cascader` | 级联选择 | `Cascader` | `label`, `options`, `clearable` |
| 表单 | `subform` | 子表单 | 引擎渲染（无需组件） | `label`, `itemPath`, `addText`；`children` 为明细字段 |
| 交互 | `button` | 按钮 | `Button` | `text`, `type`(primary/default/dashed/text/link/danger), `danger`, `onClick` |
| 交互 | `link` | 链接 | `Typography.Link` | `text`, `href`, `target` |

> `options` 支持两种写法：逗号字符串 `"A,B,C"` 或数组 `[{ label, value }]`，引擎会自动归一。
> 业务系统若有专用组织树 / 字典服务，用 `registerMaterials()` 覆盖同名 `ec-org-picker` / `ec-dict-select` 即可。

### 设计器（开箱即用）

`SchemaDesigner` 自带物料面板、拖拽画布、属性设置面板、顶栏（保存 / 预览 / 导出 JSON / HTML）。
属性面板用的**就是本包注册的 antd 控件**，设计时与运行时同一套 UI 库。

### 动作（Actions）

节点 `events` 里配置，纯数据、不含可执行代码：

| action | 作用 | 关键 args |
| --- | --- | --- |
| `toast` | 消息提示 | `{ text, type: info\|success\|warning\|error }` |
| `setState` | 写 scope | `{ path, value }` |
| `resetForm` | 重置表单 | `{ path? }`（默认 `form`） |
| `submitForm` | 校验并提交 | `{ from?, to?, reset?, successText? }` → 触发 `onSubmit` |
| `confirm` | 确认框 | `{ text, title?, then: [Action...] }`（确认后执行 `then`） |
| `navigate` | 页面跳转 | `{ to }`（交给宿主 `navigate` prop） |

消息 / 确认框的宿主能力（antd 实现）由本包提供；动作逻辑本身在 core。

---

## 数据绑定规则（重点）

1. **按 id 自动绑定**：未写 `modelValue` 的表单控件，值落在 `data.form.<节点id>`。
   所以初始数据像 `{ form: { name: "张三" } }`，`name` 就是节点 `id`。
2. **显式绑定**：写 `props.modelValue = "form.xxx"` 可指定任意 scope 路径。
3. **子表单**：`ec-subform` 的 `itemPath="orders"`，组内字段绑定 `form.orders[i].<id>`，支持无限嵌套。
4. **展示类表达式**：`ec-text` / `ec-table` 等可用 `{{path}}` 绑定 scope 变量，
   例如 `ec-table` 的 `data: "{{list}}"` 或 `ec-text` 的 `text: "{{form.name}}"`。

---

## API 速查

### 本包导出（`@x-ac/web-design-react-antd`）

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `antdAdapter` | `UiAdapter` | 组装好的适配包（组件 + 物料 + 设计器控件 + 动作 + 绑定通道），传给 `ReactDesignProvider` 的 `adapter` |
| `ANTD_COMPONENTS` | `Record` | `ec-*` → antd 组件映射表 |
| `antdMaterials` | `Material[]` | 物料元数据（core 27 + antd 专有 3） |
| `antdDesignerKit` | `DesignerKit` | 设计器 7 个槽位控件 |
| `antdActionAdapter` / `runActions` | — | 消息与确认框副作用 |
| `AntdConfigProvider` / `AntdAppBridge` / `setAntdAppContext` | — | 可选的 antd `<App>` context 注入 |
| `missingComponents` | `(adapter) => string[]` | 检查哪些协议物料没有组件实现（本包恒为 `[]`） |

### 引擎导出（来自 `@x-ac/web-design-react` / `core`）

| 来源 | 导出 | 用途 |
| --- | --- | --- |
| `@x-ac/web-design-react` | `ReactDesignProvider`, `SchemaRenderer`, `SchemaRendererHandle`(类型), `createReactDesign` | 渲染上下文与渲染器 |
| `@x-ac/web-design-react/designer` | `SchemaDesigner`, `SchemaDesignerHandle`(类型) | 设计器 |
| `@x-ac/web-design-core` | `createMemoryRepository`, `createEmptyPage`, `registerMaterials`, `materialKey`, `validateData`, `exportData`, `getByPath`, `setByPath`, `evaluate` | 仓储 / Schema 构建 / 数据处理 |

### `SchemaRenderer` 常用 props

| prop | 说明 |
| --- | --- |
| `page` | `PageSchema` 或 JSON 字符串（自动解析 + 版本迁移） |
| `data` | 初始 scope（优先于 `page.state`） |
| `onSubmit` | `submitForm` 校验通过后的回调，拿到还原好的数据对象 |
| `onDataChange` | scope 每次变化回传（实时数据面板用） |
| `onEvent` | 事件拦截钩子，返回 `false` 或 `payload.preventDefault()` 可阻断预设动作 |
| `onNodeEvent` | 只读通知（即使被阻断也会收到，适合埋点） |
| `adapter` | 只覆盖动作副作用；`ui` 只覆盖适配包；二者缺省取 `ReactDesignProvider` 注入的 |
| `navigate` | 接管 `navigate` 动作（页面跳转） |
| `ref` | `SchemaRendererHandle`：`validate()`、`getData()`、`exportData()`、`getErrors()`、`reset()`、`setData()`、`reload()`、`scope` |

### `SchemaDesigner` 常用 props

| prop | 说明 |
| --- | --- |
| `pageId` | 页面 id，从仓储载入 |
| `repository` | 页面仓储（`createMemoryRepository` 或自定义实现） |
| `onSaved` | 保存后回调（id） |
| `onPreview` | 点「预览」回调（id） |
| `onExportSchema` | 导出 JSON / HTML 时同步抛出，便于归档 |
| `previewUrl` / `navigate` / `onBack` | 预览地址、跳转、返回 |

---

## 自定义业务物料

用 `registerMaterials` 把你的业务组件组合进适配包，**返回新的 adapter（不改入参）**：

```tsx
import { registerMaterials } from "@x-ac/web-design-core";
import { antdAdapter } from "@x-ac/web-design-react-antd";

const adapter = registerMaterials(antdAdapter, [
  {
    component: "biz-rate",          // 业务前缀，不要占用 ec- 命名空间
    title: "满意度",
    kind: "field",
    impl: MyBizRate,                // React 组件，受控通道 value/onChange
    props: { modelValue: "", max: 5 },
    fields: [{ key: "max", label: "最高分", type: "number" }],
  },
]);
```

组件实现遵循统一约定：用 `value` / `onChange` 受控，把 UI 库原生事件翻译成「值」
（Input 取 `e.target.value`、Switch 取 `boolean`、DatePicker 取字符串），不要透传原始 event。

---

## 常见问题 / 避坑

- **点预览 / 切换渲染器白屏，控制台 `Cannot read properties of undefined (reading 'map')`**
  `repository.get()` 返回的是 **`PageRecord`（`{ id, schema, updatedAt }`）**，
  必须取 `.schema` 再传给 `SchemaRenderer`。把整个 record 当 `page` 会导致 `schema.children` 为 `undefined`。
- **antd 6 不需要 v5 patch**：不要安装 `@ant-design/v5-patch-for-react-19`。
- **peer 依赖自动安装**：npm ≥ 7 / pnpm ≥ 8 装本包时会自动装 `core` / `react` / `antd` 等 peer；
  若用 yarn v1，请手动补装。
- **不要占用 `ec-` 协议命名空间**：业务物料用 `biz-*` 之类的前缀，否则可能悄悄顶掉官方物料语义。
- **`options` 两种写法通用**：字符串 `"A,B"` 与数组 `[{label,value}]` 都能用。

---

## 开发 / 构建 / 发布（贡献者）

```bash
pnpm install
pnpm dev            # 本地示例站 http://127.0.0.1:5176
pnpm typecheck      # 库 + 示例两轮 tsc
pnpm test           # 用例（适配包 + 示例 Schema 运行时冒烟）
pnpm build          # 库产物 dist/
pnpm verify:dist    # 库产物存在性 / 非空 / d.ts 路径硬校验
pnpm check          # 以上全部 + build:example + pages:build
```

工作流：

| 工作流 | 触发 | 作用 |
| --- | --- | --- |
| `publish.yml` | push `v*` tag / 手动（默认 dry_run） | OIDC 可信发布到 npm（免 token，带 provenance） |
| `pages.yml` | push main / 手动 | 构建示例站并部署到 GitHub Pages |

> Pages 地址：`https://cn-xac.github.io/web-design-react-antd/`
> 仓库改名后需到 npmjs 重新登记 Trusted Publisher 的 `repository` 字段（`web-design-react-antd`）。

---

## 相关链接

- 在线示例：https://cn-xac.github.io/web-design-react-antd/
- 仓库：https://github.com/cn-xac/web-design-react-antd
- 引擎内核：`@x-ac/web-design-core`
- React 引擎：`@x-ac/web-design-react`
- 姊妹适配包（Vue）：`@x-ac/web-design-vue-element-plus`
- AI 参考文档（机器可读）：见仓库根目录 [`AI.md`](./AI.md)
