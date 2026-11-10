/**
 * 物料清单 = core 通用清单（补 antd 专有属性）+ antd 专有物料。
 *
 * 与 Vue 的 Element Plus 适配层同一套分层：
 * 1. core MATERIALS：跨库通用能力，任何适配包都该有；
 * 2. ANTD_FIELD_PATCHES：给既有物料补 antd 专有属性（同名键用 mergeFields 覆盖，不重复）；
 * 3. ANTD_EXTRA_MATERIALS：antd 才有、core 没有的组件，标 portable:false。
 *
 * 关键：核心 27 个协议物料**全部保留**，缺实现会由渲染器降级为占位；
 * 本适配层已用 ANTD_COMPONENTS 覆盖了其中 27 个（subform 由引擎按 kind 渲染，无需组件）。
 */
import {
  MATERIALS,
  bareKey,
  materialKey,
  mergeFields,
  tagPortability,
  type Material,
  type PropField,
} from "@x-ac/web-design-core";

/** 给 core 既有物料补 antd 专有属性；键与 core 字段同名时由 mergeFields 覆盖 */
const ANTD_FIELD_PATCHES: Record<string, PropField[]> = {
  input: [
    { key: "maxlength", label: "最大字数", type: "number", group: "advanced" },
    { key: "showCount", label: "显示字数", type: "boolean", group: "advanced" },
    { key: "showSearch", label: "可搜索", type: "boolean", group: "advanced" },
  ],
  textarea: [{ key: "showCount", label: "显示字数", type: "boolean", group: "advanced" }],
  select: [
    { key: "showSearch", label: "可搜索", type: "boolean", group: "basic" },
    { key: "mode", label: "模式", type: "select", options: ["single", "multiple", "tags"], group: "advanced" },
  ],
  number: [{ key: "step", label: "步长", type: "number", group: "advanced" }],
  slider: [{ key: "step", label: "步长", type: "number", group: "advanced" }],
  rate: [
    { key: "count", label: "星星数", type: "number", group: "basic" },
    { key: "allowHalf", label: "允许半星", type: "boolean", group: "advanced" },
  ],
  date: [{ key: "showAlpha", label: "透明通道", type: "boolean", group: "advanced" }],
  button: [{ key: "danger", label: "危险按钮", type: "boolean", group: "style" }],
  color: [{ key: "showAlpha", label: "透明通道", type: "boolean", group: "advanced" }],
};

const patched: Material[] = MATERIALS.map((material) => {
  const patch = ANTD_FIELD_PATCHES[bareKey(material.component)];
  if (!patch?.length) return material;
  return { ...material, fields: mergeFields(material.fields, patch) };
});

/** antd 专有物料：core 清单里没有，标 owner=adapter / portable=false */
const ANTD_EXTRA_RAW: Material[] = [
  {
    component: materialKey("segmented"),
    title: "分段控制",
    category: "表单",
    kind: "field",
    icon: "▭",
    owner: "adapter",
    portable: false,
    isFormControl: true,
    defaultProps: { label: "视图", options: "日,周,月", required: false },
    fields: [
      { key: "label", label: "标签", type: "text" },
      { key: "options", label: "选项", type: "options" },
      { key: "modelValue", label: "数据绑定", type: "text" },
      { key: "disabled", label: "禁用", type: "boolean" },
    ],
  },
  {
    component: materialKey("color"),
    title: "颜色选择",
    category: "表单",
    kind: "field",
    icon: "◐",
    owner: "adapter",
    portable: false,
    isFormControl: true,
    defaultProps: { label: "主题色", modelValue: "#1677ff", showAlpha: false },
    fields: [
      { key: "label", label: "标签", type: "text" },
      { key: "modelValue", label: "数据绑定", type: "text" },
      { key: "showAlpha", label: "透明通道", type: "boolean" },
    ],
  },
  {
    component: materialKey("cascader"),
    title: "级联选择",
    category: "表单",
    kind: "field",
    icon: "⋗",
    owner: "adapter",
    portable: false,
    isFormControl: true,
    defaultProps: { label: "地区", options: "华东,华南", placeholder: "请选择", clearable: true },
    fields: [
      { key: "label", label: "标签", type: "text" },
      { key: "options", label: "选项", type: "options" },
      { key: "modelValue", label: "数据绑定", type: "text" },
      { key: "placeholder", label: "占位提示", type: "text" },
      { key: "clearable", label: "可清空", type: "boolean" },
    ],
  },
];

const ANTD_EXTRA_MATERIALS: Material[] = ANTD_EXTRA_RAW.map((material) =>
  tagPortability({ ...material, owner: "adapter", portable: false }),
);

export const antdMaterials: Material[] = [...patched, ...ANTD_EXTRA_MATERIALS];

export { ANTD_FIELD_PATCHES, ANTD_EXTRA_MATERIALS };
