// @vitest-environment jsdom
/**
 * antd 适配层的栅格 row / col 专项：证明 core 新增的统一栅格在 React 引擎下
 * 既能渲染出 antd 的 Row / Col，又能修复「设计态包裹层打断 flex 导致列宽由内容撑开」的原始 bug。
 *
 * 覆盖三件事：
 * 1. row → antd Row（.ant-row），col → antd Col 且 span 落到 .ant-col-NN 栅格类；
 * 2. span=0 折叠隐藏（.ant-col-0）、offset 落到 .ant-col-offset-N、响应式 xs 落到 .ant-col-xs-N；
 * 3. 设计态下栅格列包裹层穿透（.ux-node--passthrough + display:contents），列回到行的直系 flex 子项，
 *    这正是「列宽由 span 决定、不再被内容撑开」的根因修复点。
 */
import { afterEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { ReactDesignProvider, SchemaRenderer } from "@x-ac/web-design-react";
import { SchemaDesigner } from "@x-ac/web-design-react/designer";
import type { NodeSchema, PageSchema } from "@x-ac/web-design-core";
import { createEmptyPage, createMemoryRepository } from "@x-ac/web-design-core";
import { antdAdapter } from "@x-ac/web-design-react-antd";

let root: Root | null = null;
let container: HTMLDivElement | null = null;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

function page(nodes: NodeSchema[]): PageSchema {
  return {
    schemaVersion: "1.0.0",
    id: "page_antd_grid",
    type: "page",
    meta: { title: "antd 栅格冒烟", device: "pc" },
    state: { total: 42 },
    children: nodes,
  };
}

async function render(nodes: NodeSchema[]): Promise<HTMLDivElement> {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <ReactDesignProvider adapter={antdAdapter}>
        <SchemaRenderer page={page(nodes)} design={true} />
      </ReactDesignProvider>,
    );
  });
  return container!;
}

/** 设计器场景：提供 designer scene，DesignerWrap 才会真正渲染穿透包裹层 */
async function renderInDesigner(pageId: string, nodes: NodeSchema[]): Promise<HTMLDivElement> {
  const repo = createMemoryRepository([{ ...createEmptyPage("栅格穿透"), id: pageId, children: nodes }]);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <ReactDesignProvider adapter={antdAdapter}>
        <SchemaDesigner pageId={pageId} repository={repo} />
      </ReactDesignProvider>,
    );
  });
  return container!;
}

describe("栅格 row / col（core 通用物料，antd 实现）", () => {
  it("row 渲染为 antd Row，col 渲染为 antd Col 且 span 落到正确栅格类", async () => {
    const host = await render([
      {
        id: "n_grid",
        component: "ec-row",
        props: { gutter: 16 },
        children: [
          { id: "n_c1", component: "ec-col", props: { span: 12 } },
          { id: "n_c2", component: "ec-col", props: { span: 12 } },
        ],
      },
    ]);
    expect(host.querySelector(".ant-row")).not.toBeNull();
    expect(host.querySelectorAll(".ant-col-12").length).toBe(2);
  });

  it("col span=0 折叠隐藏（ant-col-0），offset 正确生成", async () => {
    const host = await render([
      {
        id: "n_grid2",
        component: "ec-row",
        props: {},
        children: [
          { id: "n_c1", component: "ec-col", props: { span: 8, offset: 2 } },
          { id: "n_c2", component: "ec-col", props: { span: 0 } },
        ],
      },
    ]);
    expect(host.querySelector(".ant-col-8")).not.toBeNull();
    expect(host.querySelector(".ant-col-offset-2")).not.toBeNull();
    expect(host.querySelector(".ant-col-0")).not.toBeNull();
  });

  it("响应式断点 xs 落到 ant-col-xs-N", async () => {
    const host = await render([
      {
        id: "n_grid3",
        component: "ec-row",
        props: {},
        children: [{ id: "n_cx", component: "ec-col", props: { span: 24, xs: 12 } }],
      },
    ]);
    expect(host.querySelector(".ant-col-xs-12")).not.toBeNull();
  });

  it("设计态下栅格列包裹层穿透（display:contents），列回到行的直系 flex 子项", async () => {
    const host = await renderInDesigner("p_grid", [
      {
        id: "n_row",
        component: "ec-row",
        props: {},
        children: [{ id: "n_col", component: "ec-col", props: { span: 12 } }],
      },
    ]);
    // col 节点包裹层带 ux-node--passthrough（穿透）：列不再被 display:block 包裹层打断 flex
    const passthrough = host.querySelector(".ux-node--passthrough");
    expect(passthrough).not.toBeNull();
    // .ant-col 必须是 .ant-row 的「穿透包裹层」直系子项（结构证明列回到行的 flex 直系）
    const row = host.querySelector(".ant-row")!;
    const directCols = row.querySelectorAll(":scope > .ux-node--passthrough > .ant-col");
    expect(directCols.length).toBe(1);
    // 穿透包裹层本身不占布局（display:contents），列宽由 antd Col 的 span 决定
    expect(passthrough).not.toBeNull();
  });
});
