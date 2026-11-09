/**
 * 完整 React 实例：一个适配包，两个引擎能力。
 *
 * - 「设计器」页：SchemaDesigner 用 antdAdapter，属性面板/顶栏/物料面板全部是 antd 组件；
 * - 「渲染器」页：SchemaRenderer 消费同一份 PageSchema，只做「用组件渲染 + 导出数据 + 派发事件」。
 *
 * 两页通过内存仓储共享 Schema：设计器保存后，渲染器重新读取，直观看到
 * 「设计时搭的 Schema → 运行时画出真实表单」这条链路。
 */
import { useCallback, useMemo, useState } from "react";
import { createRef } from "react";
import { Segmented, Typography } from "antd";
import { createMemoryRepository, createEmptyPage } from "@x-ac/design-core";
import type { PageSchema, UiEventPayload } from "@x-ac/design-core";
import { ReactDesignProvider, SchemaRenderer } from "@x-ac/design-react";
import type { SchemaRendererHandle } from "@x-ac/design-react";
import { SchemaDesigner } from "@x-ac/design-react/designer";
import { antdAdapter, AntdConfigProvider } from "@x-ac/design-react-antd";

const PAGE_ID = "demo";

/** 预置页面：覆盖自动绑定、常用字段、子表单（明细数组）、动作按钮 */
function seedPage(): PageSchema {
  return {
    ...createEmptyPage("Ant Design 适配层示例"),
    id: PAGE_ID,
    state: {},
    children: [
      {
        id: "n_title",
        component: "title",
        props: { text: "员工信息登记", level: 3 },
      },
      {
        id: "n_name",
        component: "input",
        props: { label: "姓名", placeholder: "请输入姓名", required: true },
      },
      {
        id: "n_dept",
        component: "select",
        props: { label: "部门", options: "技术中心,产品中心,设计中心", placeholder: "请选择部门" },
      },
      {
        id: "n_count",
        component: "number",
        props: { label: "司龄", min: 0, max: 50, precision: 0 },
      },
      {
        id: "n_join",
        component: "date",
        props: { label: "入职日期", valueFormat: "YYYY-MM-DD" },
      },
      {
        id: "n_remote",
        component: "switch",
        props: { label: "远程办公", activeText: "是", inactiveText: "否" },
      },
      {
        id: "n_level",
        component: "segmented",
        props: { label: "职级", options: "P4,P5,P6,P7" },
      },
      {
        id: "members",
        component: "ec-subform",
        props: { label: "项目成员", itemPath: "members", addText: "添加成员" },
        children: [
          { id: "m_name", component: "input", props: { label: "成员姓名" } },
          { id: "m_role", component: "select", props: { label: "角色", options: "开发,设计,测试,产品" } },
        ],
      },
      {
        id: "n_submit",
        component: "button",
        props: { label: "提交", type: "primary" },
        events: { click: [{ type: "submitForm" }] },
      },
    ] as PageSchema["children"],
  };
}

const seedData = {
  form: {
    n_name: "张三",
    n_dept: "技术中心",
    n_count: 3,
    n_join: "2024-03-01",
    n_remote: true,
    n_level: "P5",
    members: [{ m_name: "李四", m_role: "开发" }],
  },
};

type TabKey = "designer" | "runtime";

export default function App() {
  const [tab, setTab] = useState<TabKey>("designer");
  const [schema, setSchema] = useState<PageSchema>(seedPage);
  const [events, setEvents] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<unknown>(null);
  const rendererRef = createRef<SchemaRendererHandle>();

  const repository = useMemo(() => createMemoryRepository([seedPage()]), []);

  /** 设计器保存后，把最新 Schema 交给渲染器 */
  const reloadSchema = useCallback(() => {
    const record = repository.get(PAGE_ID);
    if (record) setSchema(JSON.parse(JSON.stringify(record)) as PageSchema);
  }, [repository]);

  const onNodeEvent = useCallback((payload: UiEventPayload) => {
    setEvents((list) => [`${payload.name} · ${payload.nodeId}`, ...list].slice(0, 8));
  }, []);

  return (
    <AntdConfigProvider>
      <main className="demo">
        <header className="demo__head">
          <Typography.Title level={2} style={{ margin: 0 }}>
            @x-ac/design-react-antd
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            vue/react 引擎只提供架构；适配包注册组件与组件配置，引擎整合成设计器与渲染器。
            属性设置面板用的也是这里注册的 Ant Design 组件。
          </Typography.Paragraph>
          <Segmented
            className="demo__tabs"
            value={tab}
            options={[
              { label: "设计器（搭建 Schema）", value: "designer" },
              { label: "渲染器（消费 Schema）", value: "runtime" },
            ]}
            onChange={(value) => setTab(value as TabKey)}
          />
        </header>

        {tab === "designer" ? (
          <section className="demo__panel demo__panel--designer">
            <div className="demo__tip">
              左侧拖入物料 → 右侧属性面板（antd 输入框/下拉/开关）配置 → 点顶栏「保存」，再切到渲染器查看效果。
            </div>
            <div className="demo__designer">
              <ReactDesignProvider adapter={antdAdapter}>
                <SchemaDesigner
                  pageId={PAGE_ID}
                  repository={repository}
                  onSaved={reloadSchema}
                  onExportSchema={reloadSchema}
                />
              </ReactDesignProvider>
            </div>
          </section>
        ) : (
          <section className="demo__panel demo__panel--runtime">
            <div className="demo__runtime">
              <ReactDesignProvider adapter={antdAdapter}>
                <SchemaRenderer
                  ref={rendererRef}
                  page={schema}
                  data={seedData}
                  onNodeEvent={onNodeEvent}
                  onSubmit={(payload) => setSubmitted(payload)}
                />
              </ReactDesignProvider>
            </div>
            <aside className="demo__side">
              <Typography.Title level={5}>导出数据</Typography.Title>
              <pre className="demo__code">{JSON.stringify(submitted ?? rendererRef.current?.getData().data ?? {}, null, 2)}</pre>
              <Typography.Title level={5}>事件派发（最近 8 条）</Typography.Title>
              {events.length ? (
                <ul className="demo__events">
                  {events.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <Typography.Text type="secondary">修改字段或点击按钮后会在这里出现</Typography.Text>
              )}
            </aside>
          </section>
        )}
      </main>
    </AntdConfigProvider>
  );
}
