/**
 * 组件实例画廊：左边按分类列出本包注册的全部物料（30 个），右边画布逐一渲染真实实例。
 *
 * 为什么走 SchemaRenderer 而不是直接 import antd 组件：
 * 实例经过「组件表 + 绑定通道 + 作用域」的真实渲染管线，看到的就是渲染器实际产出的效果，
 * 而不是一套游离于引擎之外的演示代码。每个物料是一个独立最小 PageSchema（props 合并
 * 物料 defaultProps 与本文件的 DEMO_PROPS 覆盖值），数据作用域统一来自 GALLERY_DATA。
 *
 * 布局约束：导航与画布各自内部滚动（scrollIntoView 锚点跳转也发生在画布内部），
 * 不产生文档级滚动 —— 与 App 壳的「视口固定、区域内滚」策略一致。
 */
import { useMemo, useState } from "react";
import { Empty, Input, Tag } from "antd";
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
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120">` +
      `<rect width="100%" height="100%" rx="6" fill="#e6f4ff"/>` +
      `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="14" fill="#1677ff">antd Image · 240×120</text>` +
      `</svg>`,
  );

/**
 * 每个物料的展示参数：合并到物料 defaultProps 之上（覆盖值优先），
 * 键为协议物料名（ec-*）；表单类初值统一走 GALLERY_DATA.form.<节点id> 自动绑定。
 */
const DEMO_PROPS: Record<string, Record<string, unknown>> = {
  "ec-input": { label: "输入框", placeholder: "请输入内容", clearable: true, maxlength: 20 },
  "ec-textarea": { label: "多行文本", rows: 3, showCount: true },
  "ec-number": { label: "数字输入", min: 0, max: 999, precision: 0 },
  "ec-select": { label: "下拉选择", options: "技术中心,产品中心,设计中心", placeholder: "请选择", showSearch: true, clearable: true },
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
  "ec-title": { text: "组件实例：标题物料", level: 3 },
  "ec-text": { text: "文本物料支持 {{form.d_input}} 变量绑定。" },
  "ec-divider": { text: "分割线" },
  "ec-tag": { text: "标签", color: "blue" },
  "ec-alert": {
    type: "info",
    message: "提示条实例",
    description: "支持 info / success / warning / error 语义，showIcon 可开关。",
    showIcon: true,
  },
  "ec-image": { src: IMAGE_SRC, width: 240, height: 120, fit: "cover", radius: 6 },
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
  "ec-grid": { columns: 2, gap: 16 },
  "ec-space": { direction: "horizontal", size: 12, wrap: true },
  "ec-subform": { label: "子表单（明细数组）", itemPath: "items", addText: "添加一项" },
};

/** 布局类物料的子节点：用函数返回新数组，避免各实例共享同一份引用 */
const DEMO_CHILDREN: Record<string, () => PageSchema["children"]> = {
  "ec-card": () => [
    { id: "d_card_text", component: "ec-text", props: { text: "卡片是布局容器，内部可嵌任意物料。" } },
  ] as PageSchema["children"],
  "ec-container": () => [
    { id: "d_ctn_text", component: "ec-text", props: { text: "容器内子节点，自带 12px 内边距。" } },
  ] as PageSchema["children"],
  "ec-grid": () => [
    { id: "d_g_name", component: "ec-input", props: { label: "栅格列一", placeholder: "请输入" } },
    { id: "d_g_dept", component: "ec-select", props: { label: "栅格列二", options: "技术中心,产品中心" } },
  ] as PageSchema["children"],
  "ec-space": () => [
    { id: "d_sp_tag", component: "ec-tag", props: { text: "antd 6.7", color: "blue" } },
    { id: "d_sp_btn", component: "ec-button", props: { text: "间距内按钮", type: "primary" } },
    { id: "d_sp_link", component: "ec-link", props: { text: "文字链接", type: "primary" } },
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
    d_textarea: "这是多行文本的初始值",
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
  const [active, setActive] = useState("");

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

  /** 锚点跳转：滚动发生在画布容器内部，不会牵动文档 */
  const jump = (component: string) => {
    setActive(component);
    document.getElementById(`demo-${component}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="demo__gallery">
      <aside className="demo__gallery-nav">
        <Input
          size="small"
          allowClear
          placeholder="搜索物料 / ec-*"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        {groups.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的物料" />
        ) : (
          groups.map((group) => (
            <div key={group.category}>
              <div className="demo__gallery-cat">{group.category}</div>
              {group.items.map((m) => (
                <button
                  key={m.component}
                  type="button"
                  className="demo__gallery-item"
                  data-active={active === m.component}
                  onClick={() => jump(m.component)}
                  title={`${m.title} · ${m.component}`}
                >
                  <span className="demo__gallery-icon">{m.icon ?? "▪"}</span>
                  <span className="demo__gallery-label">
                    {m.title}
                    <code>{m.component}</code>
                  </span>
                </button>
              ))}
            </div>
          ))
        )}
      </aside>

      <div className="demo__gallery-main">
        {groups.length === 0 ? null : (
          <ReactDesignProvider adapter={antdAdapter}>
            {groups.map((group) =>
              group.items.map((m) => (
                <section key={m.component} id={`demo-${m.component}`} className="demo__gallery-block">
                  <div className="demo__gallery-block-head">
                    <span className="demo__gallery-name">
                      {m.icon ?? "▪"} {m.title}
                    </span>
                    <code className="demo__gallery-key">{m.component}</code>
                    <Tag color="blue" style={{ marginLeft: "auto" }}>
                      {m.category ?? "其他"}
                    </Tag>
                  </div>
                  <SchemaRenderer page={demoPage(m)} data={GALLERY_DATA} />
                </section>
              )),
            )}
          </ReactDesignProvider>
        )}
      </div>
    </div>
  );
}
