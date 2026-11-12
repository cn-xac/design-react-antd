# @x-ac/web-design-react-antd — AI Reference

Machine-readable reference for AI coding agents. Use this to generate **correct** code with
`@x-ac/web-design-react-antd` without reading `node_modules`. Everything below is verified against the
published types (`@x-ac/web-design-react` / `@x-ac/web-design-core` `1.0.0`) and this package's source.

**What this package is:** a React + Ant Design 6 *adapter* for a schema-driven page/form engine.
The engine provides architecture; this package maps 30 protocol materials (`ec-*`) to antd components,
plus the designer property-panel controls and message/confirm host capabilities. You describe the page
as `PageSchema` (plain JSON), and `SchemaRenderer` draws a real, interactive antd page.

**Do NOT** hand-write UI components for the form. Author `PageSchema` data instead.

---

## 1. Install (exact)

```bash
pnpm add @x-ac/web-design-react-antd antd dayjs
# npm: npm i @x-ac/web-design-react-antd antd dayjs
```

- Peer deps (auto-installed by npm≥7 / pnpm≥8; add manually on yarn v1):
  `@x-ac/web-design-core@^1.0.0`, `@x-ac/web-design-react@^1.0.0`, `react>=18`, `react-dom>=18`, `antd@^6`, `dayjs@^1.11`.
- **antd MUST be 6.x.** antd 6 supports React 19 natively — do **NOT** add `@ant-design/v5-patch-for-react-19`.
- Import the engine stylesheet once: `import "@x-ac/web-design-react/style.css";`

---

## 2. Import map (where each symbol comes from)

| Symbol | Module path |
| --- | --- |
| `antdAdapter`, `ANTD_COMPONENTS`, `antdMaterials`, `antdDesignerKit`, `antdActionAdapter`, `runActions`, `setAntdAppContext`, `AntdConfigProvider`, `AntdAppBridge`, `missingComponents` | `@x-ac/web-design-react-antd` |
| `ReactDesignProvider`, `SchemaRenderer`, type `SchemaRendererHandle` | `@x-ac/web-design-react` |
| `SchemaDesigner`, type `SchemaDesignerHandle` | `@x-ac/web-design-react/designer` |
| `defineReactAdapter`, `REACT_BINDING`, `createDesignerKit`, `useFieldModel` | `@x-ac/web-design-react/kit` |
| `createMemoryRepository`, `createEmptyPage`, `registerMaterials`, `materialKey`, `missingComponents`, `MATERIALS`, `validateData`, `exportData`, `getByPath`, `setByPath`, `evaluate`, types `PageSchema`/`NodeSchema`/`PageRecord`/`PageRepository` | `@x-ac/web-design-core` |

`ReactDesignProvider` **requires** `adapter={antdAdapter}` (or any `UiAdapter`). Without it the renderer
falls back to a built-in native adapter lacking these materials.

---

## 3. Materials catalog (30 protocol materials → antd)

Every material key is prefixed `ec-` in `PageSchema` (`component: "ec-input"`). All 30 have a component
implementation in this adapter (`missingComponents(antdAdapter) === []`). `options` accepts either a
comma string `"A,B,C"` or an array `[{ label, value }]` — both are normalized.

### 布局 (layout)
| `ec-*` | antd | key props |
| --- | --- | --- |
| `ec-container` | `div` | `padding`, `onClick` |
| `ec-grid` | CSS Grid | `columns` (number of cols) |
| `ec-card` | `Card` | `title`, `extra` |
| `ec-space` | `Space` | — |

### 展示 (display)
| `ec-*` | antd | key props |
| --- | --- | --- |
| `ec-title` | `Typography.Title` | `text`, `level` (1–5) |
| `ec-text` | `Typography.Paragraph` | `text` (supports `{{expr}}`) |
| `ec-divider` | `Divider` | `text`, `dashed` (bool) |
| `ec-tag` | `Tag` | `text`, `color` |
| `ec-alert` | `Alert` | `type` (info\|success\|warning\|error), `message`, `description` |
| `ec-image` | `Image` | `src`, `alt`, `width`, `height` (empty `src` → placeholder) |
| `ec-table` | `Table` | `columns` (`[{label,prop}]`), `data`/`rows` (array), `emptyText` |

### 表单 (form controls — bind to scope)
| `ec-*` | antd | key props |
| --- | --- | --- |
| `ec-input` | `Input` | `label`, `placeholder`, `maxlength`, `showCount`, `clearable`, `type`, `rows`(→textarea) |
| `ec-textarea` | `Input.TextArea` | `label`, `rows`, `showCount` |
| `ec-number` | `InputNumber` | `label`, `min`, `max`, `precision`, `step` |
| `ec-select` | `Select` | `label`, `options`, `placeholder`, `clearable`, `showSearch`, `mode`(single\|multiple\|tags) |
| `ec-radio` | `Radio.Group` | `label`, `options` |
| `ec-checkbox` | `Checkbox.Group` | `label`, `options` |
| `ec-switch` | `Switch` | `label`, `activeText`, `inactiveText` |
| `ec-date` | `DatePicker` | `label`, `type`(date\|month\|daterange\|datetime), `valueFormat` |
| `ec-rate` | `Rate` | `label`, `count`, `allowHalf` |
| `ec-slider` | `Slider` | `label`, `min`, `max`, `step` |
| `ec-org-picker` | `Input` (read-only placeholder) | `label`, `placeholder` |
| `ec-dict-select` | `Select` | `label`, `options`, `dictKey`, `clearable` |
| `ec-amount-input` | `InputNumber` (¥ prefix) | `label`, `currency`, `precision`, `min`, `max` |
| `ec-segmented` | `Segmented` | `label`, `options` |
| `ec-color` | `ColorPicker` | `label`, `showAlpha` |
| `ec-cascader` | `Cascader` | `label`, `options`, `clearable` |
| `ec-subform` | engine-rendered (no component) | `label`, `itemPath`, `addText`; `children` = detail fields |

### 交互 (interaction)
| `ec-*` | antd | key props |
| --- | --- | --- |
| `ec-button` | `Button` | `text`, `type`(primary\|default\|dashed\|text\|link\|danger), `danger`, `onClick` |
| `ec-link` | `Typography.Link` | `text`, `href`, `target` |

Notes:
- `ec-subform` is rendered by the engine from `kind`, not from a UI-library component; its `children` are the
  detail fields. It needs no entry in `ANTD_COMPONENTS`.
- To override `ec-org-picker` / `ec-dict-select` with a real org-tree / dict service, use `registerMaterials`.
- Keep business materials out of the `ec-` namespace (use `biz-*` etc.).

---

## 4. Schema structure

```ts
// PageSchema (required fields only)
{
  schemaVersion: "1.0.0",
  id: string,
  type: "page",
  meta?: { title?, device?: "pc"|"pad"|"h5", description? },
  state?: Record<string, unknown>,        // page-level initial scope (overridden by renderer `data`)
  dataSource?: Record<string, { type: "http"|"static", url?, method?, params?, auto?, data? }>,
  children: NodeSchema[],
}

// NodeSchema (required: id, component)
{
  id: string,                             // also the default data key (form.<id>)
  component: string,                      // "ec-input" etc.
  props?: Record<string, unknown>,        // material-specific; unknown keys are passed through
  style?: Record<string, string|number>,
  directives?: { name: "show"|"if"|"for", value?: string, itemKey?, indexKey? }[],
  events?: Record<string, { action: string, args?: Record<string, unknown> }[]>,
  rules?: { type: RuleType, value?, message?, when? }[],   // validation (data contract)
  children?: NodeSchema[],
}
```

`RuleType` = `required | minLength | maxLength | min | max | pattern | email | phone | integer`.
Rules are pure data (never executable code). `message` supports `{label}` / `{value}` placeholders.

`page` prop of `SchemaRenderer` also accepts a **JSON string** (auto-parsed + version-migrated).

---

## 5. Data binding contract

1. **Auto-bind by id:** a form control without `modelValue` writes/reads `data.form.<nodeId>`.
   So initial data is `{ form: { name: "张三" } }` where `name` is the node `id`.
2. **Explicit bind:** set `props.modelValue = "form.xxx"` (or any scope path) to target a specific key.
3. **Subform:** `ec-subform` with `itemPath="orders"` → detail fields bind `form.orders[i].<id>`; nesting is unlimited.
4. **Display expressions:** `{{path}}` in display props (e.g. `ec-text` `text`, `ec-table` `data`) resolves against scope.
   Example: `ec-table` `data: "{{list}}"`, `ec-text` `text: "{{form.name}}"`.
5. **React channel:** all controls are controlled via `value` + `onChange`; components translate native
   events to values (Input → `e.target.value`, Switch → boolean, DatePicker → string). Never pass raw events.

---

## 6. Built-in Actions (configured in node `events`)

Pure-data, no executable code. Host capabilities (message/confirm UI) come from this adapter.

| `action` | args | effect |
| --- | --- | --- |
| `toast` | `{ text, type?: info\|success\|warning\|error }` | message toast |
| `setState` | `{ path: string, value: unknown }` | write scope by path |
| `resetForm` | `{ path?: string }` (default `form`) | reset form to initial |
| `submitForm` | `{ from?, to?, reset?, successText? }` | validate then emit `onSubmit` |
| `confirm` | `{ text, title?, then: Action[] }` | confirm dialog; run `then` on OK |
| `navigate` | `{ to: string }` | page nav (delegated to `navigate` prop) |

Example:
```ts
events: {
  click: [
    { action: "toast", args: { text: "提交成功", type: "success" } },
    { action: "submitForm", args: { from: "form", to: "rows", reset: false } },
  ],
}
```

---

## 7. React API signatures

### `ReactDesignProvider` (`@x-ac/web-design-react`)
```ts
<ReactDesignProvider adapter={antdAdapter}>{children}</ReactDesignProvider>
// props: { adapter: UiAdapter; children?: ReactNode }
```

### `SchemaRenderer` (`@x-ac/web-design-react`)
```ts
<SchemaRenderer
  page={page}                       // PageSchema | string
  data={data}                       // Record<string,unknown>  (initial scope; overrides page.state)
  mode?={"view"|"edit"}             // default "view"
  onSubmit?={(payload: Record<string,unknown>) => void}
  onDataChange?={(data: Record<string,unknown>) => void}
  onEvent?={(payload: UiEventPayload) => false | void}   // return false / payload.preventDefault() to block
  onNodeEvent?={(payload: UiEventPayload) => void}       // read-only notify (also fires when blocked)
  adapter?={ActionAdapter}          // override only action side-effects
  ui?={UiAdapter}                   // override adapter (else uses provider's)
  navigate?={(to: string) => void}
  ref={ref}                         // SchemaRendererHandle
/>
```

`SchemaRendererHandle` (via `ref`):
```ts
interface SchemaRendererHandle {
  validate(): boolean;
  getData(options?: { includeEmpty?: boolean; validate?: boolean; materials?: MaterialRegistry }): DataExportResult;
  exportData(options?): DataExportResult;   // alias of getData
  getErrors(): Record<string, string>;
  reset(): void;
  setData(patch: Record<string, unknown>): void;
  reload(): void;                            // re-run dataSource fetch
  scope: Record<string, unknown>;
}
// DataExportResult: { valid, data (nested), flat ("form.name"→value), fields, unbound, errors, exportedAt }
```

### `SchemaDesigner` (`@x-ac/web-design-react/designer`)
```ts
<SchemaDesigner
  pageId={string}
  repository?={PageRepository}        // createMemoryRepository(...) or custom
  previewUrl?={(id: string) => string}
  navigate?={(to: string) => void}
  onBack?={() => void}
  onPreview?={(id: string) => void}
  onSaved?={(id: string) => void}
  onExportSchema?={(p: { kind: "json"|"html"; content: string; schema: PageSchema }) => void}
  ref={ref}                           // SchemaDesignerHandle: exportSchema/exportHtml/importSchema/save
/>
```
Must be wrapped in `<ReactDesignProvider adapter={antdAdapter}>`.

### `createMemoryRepository` (`@x-ac/web-design-core`)
```ts
const repository = createMemoryRepository(seedPages?: PageSchema[]): PageRepository;
// PageRepository: { list(); get(id); save(schema): PageRecord; remove(id) }
// PageRecord = { id, schema: PageSchema, updatedAt: number }
```

---

## 8. Core helpers (`@x-ac/web-design-core`)

| fn | signature / note |
| --- | --- |
| `createEmptyPage(title?)` | → `PageSchema` with empty `children` |
| `registerMaterials(adapter, defs, opts?)` | → **new** `UiAdapter` (immutable); `opts.overwrite` to override same-name; `component` must not be `ec-*` |
| `materialKey("input")` | → `"ec-input"` (prefix normalization) |
| `missingComponents(adapter)` | → `string[]` of protocol materials lacking a component (this adapter: `[]`) |
| `validateData(page, scope, opts?)` | → `{ valid, errors }` |
| `exportData(page, scope, opts?)` | → `DataExportResult` (see §7) |
| `getByPath(scope, "a.b[0].c")` / `setByPath(scope, path, value)` | path get/set incl. array indices |
| `evaluate("form.name", scope)` / `resolveValue(value, scope)` | restricted expression eval (`{{ }}` support); never `eval`/`new Function` |
| `walk(nodes, fn)`, `findNode(nodes, id)`, `insertNode(...)`, `relocateNode(...)` | tree ops for programmatic Schema building |

---

## 9. Recommended patterns

**(a) Render-only (simplest):**
```tsx
<ReactDesignProvider adapter={antdAdapter}>
  <SchemaRenderer page={page} data={{ form: {} }} onSubmit={console.log} />
</ReactDesignProvider>
```

**(b) Designer + renderer sharing one Schema (low-code loop):**
```tsx
const repository = useMemo(() => createMemoryRepository([seedPage()]), []);
const [schema, setSchema] = useState<PageSchema | null>(null);
const reload = () => { const r = repository.get(PAGE_ID); if (r) setSchema(r.schema); }; // NOTE: .schema, not the record
// <SchemaDesigner pageId={PAGE_ID} repository={repository} onSaved={reload} onPreview={...} />
// <SchemaRenderer page={schema!} data={{ form: {} }} />
```
Wrap both in `<ReactDesignProvider adapter={antdAdapter}>`, optionally `<AntdConfigProvider>` for themed toasts.

**(c) Custom business material:**
```tsx
const adapter = registerMaterials(antdAdapter, [
  { component: "biz-rate", title: "满意度", kind: "field", impl: MyRate,
    props: { modelValue: "" }, fields: [{ key: "max", label: "最高分", type: "number" }] },
]);
// impl must be controlled via value/onChange and translate native events to values.
```

---

## 10. Pitfalls (exact)

1. **White screen after preview / schema switch — `Cannot read properties of undefined (reading 'map')`.**
   `repository.get(id)` returns a **`PageRecord`** (`{ id, schema, updatedAt }`), not a `PageSchema`.
   Pass `record.schema` to `<SchemaRenderer page={...}>`. Passing the whole record makes `schema.children`
   undefined and the renderer crashes. ✅ `setSchema(repository.get(PAGE_ID).schema)`.
2. **antd 6, not 5.** Do not add `@ant-design/v5-patch-for-react-19`.
3. **Peer auto-install.** With npm≥7 / pnpm≥8 peers install automatically; yarn v1 needs manual install.
4. **Never occupy `ec-` namespace** for business materials (use `biz-*` etc.) — silent override risk.
5. **`options` format is flexible** — `"A,B"` or `[{label,value}]`; don't hand-build antd `options` shape.
6. **`page` accepts a JSON string** too (auto-parse + migrate); don't pre-parse if you already have an object.
7. **`data` initial scope uses `form.<id>` keys**, not bare node ids, for auto-bound controls.
8. **Don't wrap `<App>` manually for toasts** unless you call `setAntdAppContext(App.useApp())`; otherwise
   the adapter falls back to antd static `message`/`Modal` (works, but theme won't sync with `ConfigProvider`).

---

## 11. Minimal runnable example (copy-paste)

```tsx
// main.tsx / App.tsx
import { ReactDesignProvider, SchemaRenderer } from "@x-ac/web-design-react";
import { antdAdapter } from "@x-ac/web-design-react-antd";
import "@x-ac/web-design-react/style.css";

const page = {
  schemaVersion: "1.0.0",
  id: "demo",
  type: "page",
  children: [
    { id: "name", component: "ec-input", props: { label: "姓名", placeholder: "请输入" } },
    { id: "dept", component: "ec-select", props: { label: "部门", options: "技术中心,产品中心" } },
    {
      id: "submit",
      component: "ec-button",
      props: { text: "提交", type: "primary" },
      events: { click: [{ action: "toast", args: { text: "hello", type: "success" } }] },
    },
  ],
};

export default function App() {
  return (
    <ReactDesignProvider adapter={antdAdapter}>
      <SchemaRenderer page={page} data={{ form: { name: "张三", dept: "技术中心" } }}
        onSubmit={(d) => console.log(d)} />
    </ReactDesignProvider>
  );
}
```

> Live demo & full example (designer + renderer + 30-material gallery):
> https://cn-xac.github.io/web-design-react-antd/
> Repo: https://github.com/cn-xac/web-design-react-antd
