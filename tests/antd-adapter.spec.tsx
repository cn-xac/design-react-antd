// @vitest-environment jsdom
/**
 * Ant Design 适配包冒烟：证明「只注册组件和组件配置」即可让引擎工作。
 *
 * 覆盖四件事：
 * 1. 物料表：协议物料全部有实现（missingComponents 为空），专有物料已登记；
 * 2. 渲染器：真画出 antd 控件（.ant-input 等），且按组件ID自动绑定回填；
 * 3. 双向绑定：onChange 归一化后写回 scope 的是「值」而非 DOM 事件；
 * 4. 设计器：用 antd designer kit，属性面板/顶栏不再回落原生，也不触发缺 kit 告警。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { SchemaRenderer, ReactDesignProvider } from "@x-ac/web-design-react";
import type { SchemaRendererHandle } from "@x-ac/web-design-react";
import { SchemaDesigner } from "@x-ac/web-design-react/designer";
import { createMemoryRepository, createEmptyPage, missingComponents } from "@x-ac/web-design-core";
import type { PageSchema } from "@x-ac/web-design-core";
import { antdAdapter, antdMaterials, antdDesignerKit, ANTD_COMPONENTS } from "@x-ac/web-design-react-antd";

const page: PageSchema = {
  schemaVersion: "1.0.0",
  id: "antd_smoke",
  type: "page",
  meta: { title: "antd 适配层冒烟" },
  state: {},
  children: [
    { id: "n_name", component: "input", props: { label: "姓名" } },
    { id: "n_dept", component: "select", props: { label: "部门", options: "技术中心,产品中心" } },
    {
      id: "members",
      component: "ec-subform",
      props: { label: "团队成员", itemPath: "members", addText: "添加成员" },
      children: [{ id: "m_name", component: "input", props: { label: "成员姓名" } }],
    },
  ],
};

const seed = { form: { n_name: "张三", n_dept: "技术中心", members: [{ m_name: "李四" }] } };

let root: Root | null = null;
let container: HTMLDivElement | null = null;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  vi.restoreAllMocks();
});

async function renderTree(element: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(element);
  });
  return container;
}

async function mountRenderer() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  const ref = createRef<SchemaRendererHandle>();
  await act(async () => {
    root!.render(
      <ReactDesignProvider adapter={antdAdapter}>
        <SchemaRenderer ref={ref} page={page} data={seed} />
      </ReactDesignProvider>,
    );
  });
  return { ref, host: container };
}

describe("适配包物料表", () => {
  it("协议物料全部有实现，missingComponents 不包含引擎渲染的 subform", () => {
    expect(antdAdapter.name).toBe("ant-design");
    expect(antdMaterials.length).toBeGreaterThan(27);
    // ec-subform 由引擎按 kind 渲染，missingComponents 已跳过
    expect(missingComponents(antdAdapter)).toHaveLength(0);
    expect(ANTD_COMPONENTS["ec-input"]).toBeTypeOf("function");
    expect(antdMaterials.some((m) => m.component === "ec-segmented")).toBe(true);
  });

  it("designer kit 覆盖全部 7 个槽位", () => {
    expect(Object.keys(antdDesignerKit).sort()).toEqual(
      ["Button", "ColorInput", "Input", "NumberInput", "Segmented", "Select", "Switch"].sort(),
    );
    expect(antdAdapter.designer).toBeTruthy();
  });
});

describe("渲染器消费已注册组件", () => {
  it("画出 antd 控件，且按组件ID自动绑定回填传入数据", async () => {
    const { host } = await mountRenderer();

    // antd Input 的 class 是 ant-input（不是引擎原生 ux-input）
    expect(host.querySelectorAll(".ant-input").length).toBeGreaterThan(0);
    expect(host.querySelector(".ux-input")).toBeNull();

    const inputs = Array.from(host.querySelectorAll("input.ant-input")) as HTMLInputElement[];
    expect(inputs[0].value).toBe("张三");
  });

  it("onChange 归一化：写回 scope 的是值，不是 DOM 事件", async () => {
    const { ref, host } = await mountRenderer();
    const input = host.querySelector("input.ant-input") as HTMLInputElement;

    await act(async () => {
      // 原生 input 事件，模拟用户键入；组件内部取 e.target.value
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
      setter.call(input, "王五");
      input.dispatchEvent(new window.Event("input", { bubbles: true }));
    });

    const form = (ref.current!.scope as Record<string, Record<string, unknown>>).form;
    expect(form.n_name).toBe("王五");
  });

  it("子表单明细组按 antd 控件渲染", async () => {
    const { host } = await mountRenderer();
    const inputs = Array.from(host.querySelectorAll("input.ant-input")) as HTMLInputElement[];
    // n_name + 一组成员姓名
    expect(inputs.map((item) => item.value)).toContain("李四");
    const addBtn = Array.from(host.querySelectorAll("button")).find((b) => b.textContent?.includes("添加成员"));
    expect(addBtn).toBeTruthy();
  });
});

describe("设计器整合已注册组件", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  it("设计器用 antd designer kit，属性面板与顶栏不回落原生，且不告警", async () => {
    const repo = createMemoryRepository([{ ...createEmptyPage("设计器冒烟"), id: "p1" }]);
    const host = await renderTree(
      <ReactDesignProvider adapter={antdAdapter}>
        <SchemaDesigner pageId="p1" repository={repo} />
      </ReactDesignProvider>,
    );

    expect(host.querySelector(".designer")).toBeTruthy();
    // 顶栏按钮由 antd Button 实现
    expect(host.querySelectorAll("button.ant-btn").length).toBeGreaterThan(0);
    expect(host.querySelectorAll("button.wbd-btn")).toHaveLength(0);
    // designer kit 已完整注册，不应触发「缺 kit」告警
    expect(
      warnSpy.mock.calls.filter((call: unknown[]) => String(call[0]).includes("designer kit")),
    ).toHaveLength(0);
  });
});
