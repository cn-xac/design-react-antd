/**
 * 组件实例画廊：按分类分组，每组是自适应网格（一行多张小卡），
 * 版式对齐 web-design-vue-element-plus 的「物料总览」（CatalogSection/MaterialCard）：
 *
 * - 每张卡片 = 卡头（物料名 + ec-* 协议名）+ 卡身（SchemaRenderer 真实渲染的实例）；
 * - 实例走「组件表 + 绑定通道 + 作用域」的真实管线，props = 物料 defaultProps
 *   叠加 DEMO_PROPS 演示覆盖值，布局类物料再挂演示子节点；
 * - 顶部搜索按标题 / ec-* / 分类过滤；画布在容器内滚动，不产生文档级滚动。
 */
import { useMemo, useState } from "react";
import { Empty, Input } from "antd";
import { createEmptyPage } from "@x-ac/web-design-core";
import type { PageSchema } from "@x-ac/web-design-core";
import { SchemaRenderer, ReactDesignProvider } from "@x-ac/web-design-react";
import { antdAdapter, antdMaterials } from "@x-ac/web-design-react-antd";

type MaterialMeta = (typeof antdMaterials)[number];

/** 分类展示顺序（与物料注册顺序一致），未知分类追加在后 */
const CATEGORY_ORDER = ["布局", "展示", "表单", "交互", "业务"];

/** 图片占位：内联 SVG data URI，离线也能渲染，不依赖任何外网资源 */
const IMAGE_SRC =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100">` +
      `<rect width="100%" height="100%" rx="6" fill="#e6f4ff"/>` +
      `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="12" fill="#1677ff">antd Image</text>` +
      `</svg>`,
  );

/**
 * 每个物料的展示参数：合并到物料 defaultProps 之上（覆盖值优先），
 * 键为协议物料名（ec-*）；表单类初值统一走 GALLERY_DATA.form.<节点id> 自动绑定。
 * 尺寸类取值按「卡片宽约 230px」缩小（如图像 160×100），保证窄卡内不溢出。
 */
const DEMO_PROPS: Record<string, Record<string, unknown>> = {
  "ec-input": { label: "输入框", placeholder: "请输入内容", clearable: true, maxlength: 20 },
  "ec-textarea": { label: "多行文本", rows: 3, showCount: true },
  "ec-number": { label: "数字输入", min: 0, max: 999, precision: 0 },
  "ec-select": { label: "下拉选择", options: "技术中心,产品中心,设计中心", placeholder: "请选择", clearable: true },
  "ec-radio": { label: "单选框", options: "选项一,选项二,选项三" },
  "ec-checkbox": { label: "多选框", options: "选项一,选项二,选项三" },
  "ec-switch": { label: "开关", activeText: "开启", inactiveText: "关闭" },
  "ec-date": { label: "日期选择", valueFormat: "YYYY-MM-DD" },
  "ec-rate": { label: "评分", count: 5, allowHalf: true },
  "ec-slider": { label: "滑块", min: 0, max: 100, step: 5 },
  "ec-segmented": { label: "分段控制", options: "日,周,月" },
  "ec-color": { label: "颜色选择", showAlpha: false },
  "ec-cascader": { label: "级联选择", options: "华东,华南", placeholder: "请选择", clearable: true },
  "ec-org-picker": { label: "组织选择", placeholder: "请选择组织" },
  "ec-dict-select": { label: "字典下拉", options: "低,中,高", placeholder: "请选择", clearable: true },
  "ec-amount-input": { label: "金额输入", precision: 2, currency: "¥" },
  "ec-title": { text: "标题物料", level: 4 },
  "ec-text": { text: "文本支持 {{form.d_input}} 变量绑定。" },
  "ec-divider": { text: "分割线" },
  "ec-tag": { text: "标签", color: "blue" },
  "ec-alert": {
    type: "info",
    message: "提示条实例",
    description: "支持 info / success / warning / error 语义。",
    showIcon: true,
  },
  "ec-image": { src: IMAGE_SRC, width: 160, height: 100, fit: "cover", radius: 6 },
  "ec-table": {
    columns: [
      { label: "姓名", prop: "name" },
      { label: "部门", prop: "dept" },
      { label: "状态", prop: "status" },
    ],
    data: "{{list}}",
    border: true,
    stripe: true,
    rowKey: "name",
  },
  "ec-link": { text: "查看详情", type: "primary" },
  "ec-button": { text: "主要按钮", type: "primary" },
  "ec-card": { title: "卡片标题", shadow: "never" },
  "ec-container": { padding: 12 },
  "ec-grid": { columns: 2, gap: 12 },
  "ec-space": { direction: "horizontal", size: 12, wrap: true },
  "ec-subform": { label: "子表单（明细数组）", itemPath: "items", addText: "添加一项" },
};

/** 布局类物料的子节点：用函数返回新数组，避免各实例共享同一份引用 */
const DEMO_CHILDREN: Record<string, () => PageSchema["children"]> = {
  "ec-card": () => [
    { id: "d_card_text", component: "ec-text", props: { text: "卡内可嵌任意物料。" } },
  ] as PageSchema["children"],
  "ec-container": () => [
    { id: "d_ctn_text", component: "ec-text", props: { text: "容器内子节点。" } },
  ] as PageSchema["children"],
  "ec-grid": () => [
    { id: "d_g_name", component: "ec-input", props: { label: "栅格列一", placeholder: "请输入" } },
    { id: "d_g_dept", component: "ec-select", props: { label: "栅格列二", options: "技术中心,产品中心" } },
  ] as PageSchema["children"],
  "ec-space": () => [
    { id: "d_sp_tag", component: "ec-tag", props: { text: "antd 6.7", color: "blue" } },
    { id: "d_sp_btn", component: "ec-button", props: { text: "按钮", type: "primary" } },
    { id: "d_sp_link", component: "ec-link", props: { text: "链接", type: "primary" } },
  ] as PageSchema["children"],
  "ec-subform": () => [
    { id: "s_name", component: "ec-input", props: { label: "商品名", placeholder: "如 机械键盘" } },
    { id: "s_qty", component: "ec-number", props: { label: "数量", min: 1, precision: 0 } },
  ] as PageSchema["children"],
};

/**
 * 画廊作用域：键 = 演示节点的 id（自动绑定规则 form.<id>）；
 * list 供 ec-table 的 {{list}} 绑定，items 供 ec-subform 的 itemPath 绑定。
 */
const GALLERY_DATA: Record<string, unknown> = {
  form: {
    d_input: "示例文本",
    d_textarea: "多行文本初始值",
    d_number: 128,
    d_select: "技术中心",
    d_radio: "选项一",
    d_checkbox: ["选项一", "选项三"],
    d_switch: true,
    d_date: "2026-11-11",
    d_rate: 4,
    d_slider: 60,
    d_segmented: "周",
    d_color: "#1677ff",
    d_cascader: ["华东"],
    d_org: "技术中心 / 平台组",
    d_dict_select: "高",
    d_amount_input: 12800.5,
    d_g_name: "张三",
    d_g_dept: "技术中心",
    items: [
      { s_name: "机械键盘", s_qty: 1 },
      { s_name: "显示器", s_qty: 2 },
    ],
  },
  list: [
    { name: "张三", dept: "技术中心", status: "在职" },
    { name: "李四", dept: "产品中心", status: "在职" },
    { name: "王五", dept: "设计中心", status: "试用" },
  ],
};

/** 单个物料的演示页：defaultProps + DEMO_PROPS 覆盖，布局类再挂子节点 */
function demoPage(meta: MaterialMeta): PageSchema {
  const node: PageSchema["children"][number] = {
    id: `d_${meta.component.slice(3)}`,
    component: meta.component,
    props: { ...(meta.defaultProps ?? {}), ...(DEMO_PROPS[meta.component] ?? {}) },
  } as PageSchema["children"][number];
  const makeChildren = DEMO_CHILDREN[meta.component];
  if (makeChildren) (node as { children?: PageSchema["children"] }).children = makeChildren();
  return {
    ...createEmptyPage(`${meta.title} · ${meta.component} 组件实例`),
    id: `gallery-${meta.component.slice(3)}`,
    state: {},
    children: [node] as PageSchema["children"],
  };
}

export function GalleryPanel() {
  const [keyword, setKeyword] = useState("");

  /** 搜索过滤（标题 / 物料名 / 分类），再按分类分组返回 */
  const groups = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const list = kw
      ? antdMaterials.filter(
          (m) =>
            m.title.includes(kw) ||
            m.component.toLowerCase().includes(kw) ||
            (m.category ?? "").toLowerCase().includes(kw),
        )
      : antdMaterials;
    const byCat = new Map<string, MaterialMeta[]>();
    for (const m of list) {
      const cat = m.category ?? "其他";
      const arr = byCat.get(cat) ?? [];
      arr.push(m);
      byCat.set(cat, arr);
    }
    const rest = [...byCat.keys()].filter((c) => !CATEGORY_ORDER.includes(c));
    return [...CATEGORY_ORDER, ...rest]
      .filter((cat) => byCat.has(cat))
      .map((category) => ({ category, items: byCat.get(category)! }));
  }, [keyword]);

  const shown = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="demo__gallery">
      <div className="demo__gallery-toolbar">
        <Input
          size="small"
          allowClear
          placeholder="搜索物料 / ec-*"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: 220 }}
        />
        <span className="demo__gallery-total">
          {shown} / {antdMaterials.length} 个物料
        </span>
      </div>

      <div className="demo__gallery-main">
        {groups.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的物料" />
        ) : (
          <ReactDesignProvider adapter={antdAdapter}>
            {groups.map((group) => (
              <section key={group.category}>
                <h3 className="demo__gallery-cat">
                  {group.category}
                  <span className="demo__gallery-count">{group.items.length}</span>
                </h3>
                <div className="demo__gallery-grid">
                  {group.items.map((m) => (
                    <div key={m.component} className="demo__gallery-card">
                      <div className="demo__gallery-card-head">
                        <span className="demo__gallery-name">
                          {m.icon ?? "▪"} {m.title}
                        </span>
                        <code className="demo__gallery-key">{m.component}</code>
                      </div>
                      <div className="demo__gallery-card-body">
                        <SchemaRenderer page={demoPage(m)} data={GALLERY_DATA} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </ReactDesignProvider>
        )}
      </div>
    </div>
  );
}
