/**
 * 适配包自检面板：把「引擎只提供架构、适配包只注册组件与配置」这件事可视化。
 *
 * 这里不渲染任何 Schema，只读取适配包导出的注册表，证明三件事：
 * 1. 组件表：ec-* → antd 组件，一一对应；
 * 2. 物料表：core 通用清单 + antd 专有物料；missingComponents 为空（设计器无置灰项）；
 * 3. designer kit：7 个槽位全部由 antd 控件实现（属性设置面板即用这些组件）。
 */
import { Typography, Tag, Descriptions, Table, Alert } from "antd";
import { MATERIALS, missingComponents } from "@x-ac/design-core";
import {
  antdAdapter,
  ANTD_COMPONENTS,
  antdMaterials,
  antdDesignerKit,
  ANTD_EXTRA_MATERIALS,
} from "@x-ac/design-react-antd";

const SLOT_LABELS: Record<string, string> = {
  Button: "按钮（顶栏 / 属性面板动作）",
  Input: "文本输入（多数字段）",
  NumberInput: "数字输入（number 字段）",
  Select: "下拉（select / options 字段）",
  Switch: "开关（boolean 字段）",
  Segmented: "分段（顶栏设备档位）",
  ColorInput: "取色（color 字段）",
};

export function AdapterPanel() {
  const missing = missingComponents(antdAdapter);
  const componentRows = Object.entries(ANTD_COMPONENTS).map(([key, impl]) => ({
    key,
    protocol: key,
    impl: typeof impl === "function" ? (impl as { name?: string }).name || "匿名组件" : String(impl),
    owner: MATERIALS.some((m) => `ec-${m.component}` === key || m.component === key) ? "core 协议物料" : "antd 专有",
  }));

  return (
    <div className="adapter">
      <Typography.Title level={4}>适配包注册清单</Typography.Title>
      <Typography.Paragraph type="secondary">
        <code>@x-ac/design-react</code> 提供设计器与渲染器架构；本包只注册组件实现、物料配置与设计器控件，
        引擎把这些注册项整合成可用的设计器。渲染器不认识任何 UI 库，只消费组件表。
      </Typography.Paragraph>

      <Alert
        type={missing.length ? "warning" : "success"}
        showIcon
        title={
          missing.length
            ? `还有 ${missing.length} 个物料缺实现：${missing.join(", ")}`
            : `物料实现齐全：${componentRows.length} 个组件全部就位，missingComponents 为空，设计器面板无置灰项`
        }
        style={{ marginBottom: 16 }}
      />

      <Descriptions bordered size="small" column={2} style={{ marginBottom: 20 }}>
        <Descriptions.Item label="适配包标识">{antdAdapter.name}</Descriptions.Item>
        <Descriptions.Item label="绑定通道">
          {antdAdapter.binding?.prop} / {antdAdapter.binding?.event}
        </Descriptions.Item>
        <Descriptions.Item label="core 通用物料">{MATERIALS.length} 个</Descriptions.Item>
        <Descriptions.Item label="antd 专有物料">{ANTD_EXTRA_MATERIALS.length} 个</Descriptions.Item>
        <Descriptions.Item label="物料表合计">{antdMaterials.length} 个</Descriptions.Item>
        <Descriptions.Item label="组件映射">{componentRows.length} 个</Descriptions.Item>
      </Descriptions>

      <Typography.Title level={5}>设计器控件（designer kit · 7 槽位）</Typography.Title>
      <div className="adapter__slots">
        {Object.entries(antdDesignerKit).map(([slot, impl]) => (
          <Tag color="blue" key={slot}>
            {slot} → {(impl as { name?: string }).name || "组件"} · {SLOT_LABELS[slot] ?? ""}
          </Tag>
        ))}
      </div>
      <Typography.Paragraph type="secondary">
        属性设置面板、物料面板、顶栏用的都是上表这些 antd 控件 —— 属性配置本身也由已注册组件实现。
      </Typography.Paragraph>

      <Typography.Title level={5}>组件映射表</Typography.Title>
      <Table
        size="small"
        pagination={false}
        rowKey="key"
        dataSource={componentRows}
        columns={[
          { title: "协议物料名", dataIndex: "protocol", width: 200 },
          { title: "antd 实现", dataIndex: "impl" },
          { title: "来源", dataIndex: "owner", width: 140 },
        ]}
      />
    </div>
  );
}
