// @vitest-environment jsdom
/**
 * 示例 Schema 冒烟：证明「完整实例」不是只有静态构建能过，运行时也真的画得出来。
 *
 * 验证四件事：
 * 1. 预置 Schema 覆盖 core 全部协议物料 + antd 专有物料（不重复、无未知组件）；
 * 2. 事件动作字段是 `action`（不是早期误写的 type），且动作名都在 core 注册表里；
 * 3. SchemaRenderer + antdAdapter 能画出 antd 控件、自动绑定回填、两级嵌套子表单；
 * 4. onDataChange 在字段变更时回传最新 scope。
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { ReactDesignProvider, SchemaRenderer } from "@x-ac/web-design-react";
import type { SchemaRendererHandle } from "@x-ac/web-design-react";
import {
  ACTION_DEFINITIONS,
  MATERIALS,
  materialKey,
  missingComponents,
  type ActionSchema,
  type NodeSchema,
} from "@x-ac/web-design-core";
import { antdAdapter, ANTD_COMPONENTS } from "@x-ac/web-design-react-antd";
import { PAGE_ID, seedPage, seedData } from "../example/src/schema";

let root: Root | null = null;
let container: HTMLDivElement | null = null;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

function walk(nodes: NodeSchema[]): NodeSchema[] {
  return nodes.flatMap((node) => [node, ...walk(node.children ?? [])]);
}

const nodes = walk(seedPage().children ?? []);
const used = new Set(nodes.map((node) => materialKey(node.component)));

describe("示例 Schema 完整性", () => {
  it("覆盖 core 全部 27 个协议物料 + antd 专有物料", () => {
    const missingCore = MATERIALS.filter((m) => !used.has(materialKey(m.component)));
    expect(missingCore.map((m) => m.component)).toEqual([]);
    // antd 专有物料也在页面里
    expect(used.has("ec-segmented")).toBe(true);
    expect(used.has("ec-color")).toBe(true);
    expect(used.has("ec-cascader")).toBe(true);
  });

  it("没有缺实现的组件，也没有未知物料", () => {
    expect(missingComponents(antdAdapter)).toEqual([]);
    const unknown = [...used].filter((key) => !(key in ANTD_COMPONENTS) && key !== "ec-subform");
    expect(unknown).toEqual([]);
    expect(seedPage().id).toBe(PAGE_ID);
  });

  it("事件动作使用 action 字段且动作名都已注册", () => {
    const registered = new Set(ACTION_DEFINITIONS.map((item) => item.name));
    const bad: string[] = [];
    for (const node of nodes) {
      for (const [event, actions] of Object.entries(node.events ?? {})) {
        for (const item of actions as Array<ActionSchema & Record<string, unknown>>) {
          if (typeof item.action !== "string") bad.push(`${node.id}.${event}: 缺少 action 字段`);
          else if (!registered.has(item.action)) bad.push(`${node.id}.${event}: 未注册动作 ${item.action}`);
          if ("type" in item) bad.push(`${node.id}.${event}: 误用了 type 字段`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("包含两级嵌套子表单，且种子数据按 node.id 对齐", () => {
    const orders = seedPage().children?.find((node) => node.id === "orders");
    const goods = orders?.children?.find((node) => node.id === "goods");
    expect(goods?.component).toBe("ec-subform");
    const form = seedData.form as Record<string, unknown>;
    expect((form.orders as unknown[])[0]).toHaveProperty("goods");
    expect(form.n_name).toBe("张三");
  });
});

describe("示例运行时", () => {
  it("渲染器画出 antd 控件，自动绑定回填，嵌套子表单数据在 scope 里", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const ref = createRef<SchemaRendererHandle>();
    await act(async () => {
      root!.render(
        <ReactDesignProvider adapter={antdAdapter}>
          <SchemaRenderer ref={ref} page={seedPage()} data={seedData} />
        </ReactDesignProvider>,
      );
    });

    expect(container.querySelectorAll(".ant-input").length).toBeGreaterThan(5);
    expect(container.querySelector(".ux-input")).toBeNull();

    const inputs = Array.from(container.querySelectorAll("input.ant-input")) as HTMLInputElement[];
    expect(inputs.map((item) => item.value)).toContain("张三");

    const result = ref.current!.getData({ validate: false });
    const form = result.data.form as Record<string, unknown>;
    const orders = form.orders as Array<Record<string, unknown>>;
    expect(orders[0].o_no).toBe("A001");
    expect((orders[0].goods as unknown[])).toHaveLength(2);
  });

  it("onDataChange 在字段修改后回传最新 scope", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const seen: Array<Record<string, unknown>> = [];
    await act(async () => {
      root!.render(
        <ReactDesignProvider adapter={antdAdapter}>
          <SchemaRenderer
            page={seedPage()}
            data={seedData}
            onDataChange={(data) => seen.push(data)}
          />
        </ReactDesignProvider>,
      );
    });

    const input = container.querySelector("input.ant-input") as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
      setter.call(input, "赵六");
      input.dispatchEvent(new window.Event("input", { bubbles: true }));
    });

    expect(seen.length).toBeGreaterThan(0);
    expect((seen.at(-1)!.form as Record<string, unknown>).n_name).toBe("赵六");
  });
});
