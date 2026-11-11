/**
 * 完整 React 实例：一个适配包，两个引擎能力，一个自检面板。
 *
 * - 「设计器」：SchemaDesigner 用 antdAdapter，属性面板/顶栏/物料面板全是 antd 组件；
 * - 「渲染器」：SchemaRenderer 消费同一份 PageSchema，只做「用组件渲染 + 导出数据 + 派发事件」；
 * - 「组件实例」：GalleryPanel 把全部物料逐个渲染成真实实例，分类导航 + 搜索定位，快速看效果；
 * - 「适配包清单」：可视化本包注册了哪些组件与配置，印证架构分层。
 *
 * 布局策略：视口固定（html/body overflow hidden），页签常驻头部，各区域在自身容器内滚动，
 * 不产生文档级滚动 —— 避免整页上下翻导致组件难以定位。
 *
 * 设计器与渲染器通过内存仓储共享 Schema：设计器保存后渲染器重新读取，
 * 直观看到「设计时搭的 Schema → 运行时画出真实表单」这条链路。
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { Segmented, Typography, Button, Empty } from "antd";
import { createMemoryRepository } from "@x-ac/web-design-core";
import type { PageSchema, UiEventPayload } from "@x-ac/web-design-core";
import { ReactDesignProvider, SchemaRenderer } from "@x-ac/web-design-react";
import type { SchemaRendererHandle } from "@x-ac/web-design-react";
import { SchemaDesigner } from "@x-ac/web-design-react/designer";
import { antdAdapter, AntdConfigProvider } from "@x-ac/web-design-react-antd";
import { PAGE_ID, seedPage, seedData } from "./schema";
import { AdapterPanel } from "./AdapterPanel";
import { GalleryPanel } from "./GalleryPanel";

type TabKey = "designer" | "runtime" | "gallery" | "adapter";

interface EventLine {
  kind: "hook" | "notify" | "submit" | "blocked";
  text: string;
}

export default function App() {
  const [tab, setTab] = useState<TabKey>("designer");
  const [schema, setSchema] = useState<PageSchema>(seedPage);
  const [liveData, setLiveData] = useState<Record<string, unknown>>(seedData);
  const [events, setEvents] = useState<EventLine[]>([]);
  const [submitted, setSubmitted] = useState<unknown>(null);
  // 用 useRef 持有命令式句柄，避免 createRef 在每次 render 重建导致 getData() 读不到
  const rendererRef = useRef<SchemaRendererHandle>(null);

  const repository = useMemo(() => createMemoryRepository([seedPage()]), []);

  /** 设计器保存 / 导出 Schema 后，把最新 Schema 交给渲染器 */
  const reloadSchema = useCallback(() => {
    const record = repository.get(PAGE_ID);
    if (record) setSchema(JSON.parse(JSON.stringify(record)) as PageSchema);
  }, [repository]);

  const pushEvent = useCallback((line: EventLine) => {
    setEvents((list) => [line, ...list].slice(0, 10));
  }, []);

  /** 拦截钩子：可阻断预设动作；这里演示对「重置表单」按钮做二次拦截记录 */
  const onEvent = useCallback(
    (payload: UiEventPayload) => {
      pushEvent({
        kind: "hook",
        text: `onEvent 拦截 · ${payload.name} · ${payload.nodeId} · 动作 ${payload.actions.map((a) => a.action).join(",") || "无"}`,
      });
      // 返回 undefined 表示放行；返回 false 或 payload.preventDefault() 可阻断
    },
    [pushEvent],
  );

  /** 只读通知：即使被 preventDefault 也会收到，适合埋点 / 状态镜像 */
  const onNodeEvent = useCallback(
    (payload: UiEventPayload) => {
      pushEvent({
        kind: "notify",
        text: `onNodeEvent 通知 · ${payload.name} · ${payload.nodeId} · value=${String(payload.value ?? "")}`,
      });
    },
    [pushEvent],
  );

  /** onDataChange：scope 每次变化的深拷贝，驱动右侧实时数据面板 */
  const onDataChange = useCallback((data: Record<string, unknown>) => {
    setLiveData(data);
    pushEvent({ kind: "notify", text: "onDataChange · scope 已更新" });
  }, [pushEvent]);

  const onSubmit = useCallback(
    (payload: Record<string, unknown>) => {
      setSubmitted(payload);
      pushEvent({ kind: "submit", text: `onSubmit 回调 · 收到 ${Object.keys(payload).length} 个字段` });
    },
    [pushEvent],
  );

  const exportNow = () => {
    const result = rendererRef.current?.getData({ validate: false });
    if (result) {
      setLiveData(result.data);
      pushEvent({ kind: "hook", text: "手动调用 ref.getData()" });
    }
  };

  return (
    <AntdConfigProvider>
      <main className="demo">
        <header className="demo__head">
          <div className="demo__head-row">
            <Typography.Title level={4} style={{ margin: 0 }}>
              @x-ac/web-design-react-antd
            </Typography.Title>
            <Segmented
              className="demo__tabs"
              value={tab}
              options={[
                { label: "设计器", value: "designer" },
                { label: "渲染器", value: "runtime" },
                { label: "组件实例", value: "gallery" },
                { label: "适配包清单", value: "adapter" },
              ]}
              onChange={(value) => setTab(value as TabKey)}
            />
          </div>
          <Typography.Paragraph type="secondary" className="demo__desc" style={{ marginBottom: 0 }}>
            引擎只提供架构；适配包注册组件与组件配置，引擎整合成设计器与渲染器。属性设置面板用的也是这里注册的 Ant Design 组件。
          </Typography.Paragraph>
        </header>

        {tab === "designer" ? (
          <section className="demo__panel demo__panel--designer">
            <div className="demo__tip">
              左侧拖入物料 → 右侧属性面板（antd 输入框 / 下拉 / 开关 / 取色）配置 → 点顶栏「保存」，再切到渲染器查看效果。
              预置 Schema 已覆盖全部协议物料与两级嵌套子表单。
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
        ) : tab === "runtime" ? (
          <section className="demo__panel demo__panel--runtime">
            <div className="demo__runtime">
              <ReactDesignProvider adapter={antdAdapter}>
                <SchemaRenderer
                  ref={rendererRef}
                  page={schema}
                  data={seedData}
                  onDataChange={onDataChange}
                  onNodeEvent={onNodeEvent}
                  onEvent={onEvent}
                  onSubmit={onSubmit}
                />
              </ReactDesignProvider>
            </div>
            <aside className="demo__side">
              <div className="demo__side-head">
                <Typography.Title level={5} style={{ margin: 0 }}>
                  实时 scope / 导出数据
                </Typography.Title>
                <Button size="small" onClick={exportNow}>
                  导出
                </Button>
              </div>
              <pre className="demo__code">{JSON.stringify(liveData, null, 2)}</pre>

              {submitted ? (
                <>
                  <Typography.Title level={5}>最近一次提交</Typography.Title>
                  <pre className="demo__code">{JSON.stringify(submitted, null, 2)}</pre>
                </>
              ) : null}

              <Typography.Title level={5}>事件派发（最近 10 条）</Typography.Title>
              {events.length ? (
                <ul className="demo__events">
                  {events.map((item, index) => (
                    <li key={`${item.text}-${index}`} data-kind={item.kind}>
                      <span className="demo__event-kind">{item.kind}</span> {item.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="修改字段或点击按钮后会在这里出现" />
              )}
              <Typography.Paragraph type="secondary" style={{ fontSize: 11 }}>
                说明：onEvent 可阻断动作，onNodeEvent 是只读通知；动作（toast / setState / resetForm /
                submitForm）由 core 执行，宿主能力（消息 / 确认框）由本适配包提供。
              </Typography.Paragraph>
            </aside>
          </section>
        ) : tab === "gallery" ? (
          <section className="demo__panel demo__panel--gallery">
            <GalleryPanel />
          </section>
        ) : (
          <section className="demo__panel demo__panel--adapter">
            <div className="demo__runtime">
              <AdapterPanel />
            </div>
          </section>
        )}
      </main>
    </AntdConfigProvider>
  );
}
