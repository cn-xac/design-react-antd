/**
 * 示例预置 Schema：一份 PageSchema 同时喂给设计器与渲染器。
 *
 * 刻意覆盖三类能力，用来证明「引擎只提供架构，适配包只注册组件与配置」：
 * 1. 全部协议物料（27 个 core + 3 个 antd 专有），按布局 / 展示 / 表单分组；
 * 2. 两级嵌套子表单（订单 → 商品明细），演示理论无限级的明细数组；
 * 3. 真实动作链（toast / setState / resetForm / submitForm）与必填校验。
 *
 * 注意：Schema 里写的是协议物料名（ec-xxx），core 的 materialKey 会归一；
 * 节点 id 同时是自动绑定的数据键（form.<id>）。
 */
import { createEmptyPage } from "@x-ac/web-design-core";
import type { PageSchema } from "@x-ac/web-design-core";

export const PAGE_ID = "demo";

/** 分组容器：设计器里能展开看到子节点树 */
const group = (id: string, title: string, children: PageSchema["children"]): PageSchema["children"][number] => ({
  id,
  component: "ec-card",
  props: { title },
  children,
}) as PageSchema["children"][number];

export function seedPage(): PageSchema {
  return {
    ...createEmptyPage("Ant Design 适配层完整示例"),
    id: PAGE_ID,
    state: {},
    children: [
      {
        id: "n_title",
        component: "ec-title",
        props: { text: "员工信息登记", level: 3 },
      },
      {
        id: "n_intro",
        component: "ec-alert",
        props: {
          type: "info",
          message: "本页全部控件来自 @x-ac/web-design-react-antd 注册的 Ant Design 组件",
          description: "渲染器只消费组件、导出数据、派发事件；设计器与渲染器共用同一份 Schema。",
        },
      },
      {
        id: "n_toolbar",
        component: "ec-space",
        children: [
          {
            id: "n_tag_new",
            component: "ec-tag",
            props: { color: "blue", text: "antd 6.7" },
          },
          {
            id: "n_link",
            component: "ec-link",
            props: { text: "适配层说明", href: "https://github.com/cn-xac/web-design-react-antd" },
          },
        ],
      } as PageSchema["children"][number],
      { id: "n_divider", component: "ec-divider", props: { text: "基础信息" } },

      group("g_basic", "基础信息", [
        {
          id: "n_grid_basic",
          component: "ec-grid",
          props: { columns: 2 },
          children: [
            {
              id: "n_name",
              component: "ec-input",
              props: { label: "姓名", placeholder: "请输入姓名", clearable: true, maxlength: 20 },
              rules: [{ type: "required", message: "请填写姓名" }],
            },
            {
              id: "n_dept",
              component: "ec-select",
              props: {
                label: "部门",
                options: "技术中心,产品中心,设计中心",
                placeholder: "请选择部门",
                clearable: true,
                showSearch: true,
              },
            },
            { id: "n_count", component: "ec-number", props: { label: "司龄", min: 0, max: 50, precision: 0 } },
            { id: "n_join", component: "ec-date", props: { label: "入职日期", valueFormat: "YYYY-MM-DD" } },
          ],
        } as PageSchema["children"][number],
      ]),

      group("g_extra", "扩展字段（antd 专有与业务语义物料）", [
        {
          id: "n_grid_extra",
          component: "ec-grid",
          props: { columns: 2 },
          children: [
            { id: "n_remark", component: "ec-textarea", props: { label: "备注", rows: 3, showCount: true } },
            { id: "n_amount", component: "ec-amount-input", props: { label: "预算", precision: 2, currency: "¥" } },
            { id: "n_level", component: "ec-segmented", props: { label: "职级", options: "P4,P5,P6,P7" } },
            { id: "n_color", component: "ec-color", props: { label: "主题色", showAlpha: false } },
            { id: "n_radio", component: "ec-radio", props: { label: "办公方式", options: "现场,混合,远程" } },
            { id: "n_checkbox", component: "ec-checkbox", props: { label: "技能", options: "Vue,React,TypeScript" } },
            {
              id: "n_dict",
              component: "ec-dict-select",
              props: { label: "字典项", options: "草稿,待审,已发布", clearable: true },
            },
            { id: "n_org", component: "ec-org-picker", props: { label: "所属组织" } },
            { id: "n_cascader", component: "ec-cascader", props: { label: "地区", options: "华东,华南" } },
            { id: "n_rate", component: "ec-rate", props: { label: "满意度", count: 5, allowHalf: true } },
            { id: "n_slider", component: "ec-slider", props: { label: "投入占比", min: 0, max: 100, step: 5 } },
            { id: "n_remote", component: "ec-switch", props: { label: "远程办公", activeText: "是", inactiveText: "否" } },
          ],
        } as PageSchema["children"][number],
      ]),

      group("g_display", "展示类物料", [
        {
          id: "n_text",
          component: "ec-text",
          props: { text: "下表数据来自 page.state / data 的作用域，用 {{list}} 绑定。" },
        },
        {
          id: "n_table",
          component: "ec-table",
          props: {
            columns: [
              { label: "姓名", prop: "name" },
              { label: "部门", prop: "dept" },
              { label: "状态", prop: "status" },
            ],
            data: "{{list}}",
          },
        },
        { id: "n_image", component: "ec-image", props: { src: "", alt: "占位图", width: 96, height: 64 } },
        { id: "n_container", component: "ec-container", props: { padding: 8 }, children: [
          { id: "n_nested_text", component: "ec-text", props: { text: "容器内可以放任意子节点" } },
        ] } as PageSchema["children"][number],
      ]),

      {
        id: "orders",
        component: "ec-subform",
        props: { label: "订单（一级子表单）", itemPath: "orders", addText: "添加订单" },
        children: [
          { id: "o_no", component: "ec-input", props: { label: "订单号", placeholder: "如 A001" } },
          { id: "o_amount", component: "ec-number", props: { label: "金额", min: 0, precision: 2 } },
          {
            id: "goods",
            component: "ec-subform",
            props: { label: "商品明细（嵌套二级）", itemPath: "goods", addText: "添加商品" },
            children: [
              { id: "g_name", component: "ec-input", props: { label: "商品名" } },
              { id: "g_qty", component: "ec-number", props: { label: "数量", min: 1, precision: 0 } },
            ],
          } as PageSchema["children"][number],
        ],
      } as PageSchema["children"][number],

      {
        id: "n_actions",
        component: "ec-space",
        children: [
          {
            id: "n_submit",
            component: "ec-button",
            props: { text: "提交并校验", type: "primary" },
            events: {
              click: [
                { action: "toast", args: { text: "正在提交…", type: "info" } },
                // reset:false 保留表单值，方便反复演示；默认行为是提交后清空
                { action: "submitForm", args: { from: "form", to: "rows", reset: false, successText: "提交成功" } },
              ],
            },
          },
          {
            id: "n_fill",
            component: "ec-button",
            props: { text: "写入示例值" },
            events: {
              click: [
                { action: "setState", args: { path: "form.n_name", value: "王五" } },
                { action: "toast", args: { text: "已把姓名写为 王五", type: "success" } },
              ],
            },
          },
          {
            id: "n_reset",
            component: "ec-button",
            props: { text: "重置表单", danger: true },
            events: {
              click: [
                { action: "confirm", args: { text: "确定要清空表单吗？", then: [
                  { action: "resetForm", args: { path: "form" } },
                ] } },
              ],
            },
          },
        ],
      } as PageSchema["children"][number],
    ] as PageSchema["children"],
  };
}

/** 初始数据：键 = 完整 node.id（自动绑定规则），rows 供 submitForm 追加 */
export const seedData = {
  form: {
    n_name: "张三",
    n_dept: "技术中心",
    n_count: 3,
    n_join: "2024-03-01",
    n_remark: "Schema 驱动渲染示例",
    n_amount: 12800.5,
    n_level: "P5",
    n_color: "#1677ff",
    n_radio: "混合",
    n_checkbox: ["React", "TypeScript"],
    n_dict: "已发布",
    n_org: "技术中心 / 平台组",
    n_cascader: ["华东"],
    n_rate: 4.5,
    n_slider: 60,
    n_remote: true,
    orders: [
      {
        o_no: "A001",
        o_amount: 899,
        goods: [
          { g_name: "机械键盘", g_qty: 1 },
          { g_name: "显示器", g_qty: 2 },
        ],
      },
    ],
  },
  rows: [],
  list: [
    { name: "张三", dept: "技术中心", status: "在职" },
    { name: "李四", dept: "产品中心", status: "在职" },
  ],
};
