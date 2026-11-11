// @vitest-environment jsdom
/**
 * 组件实例画廊冒烟：全部物料都能经真实渲染管线画出实例，不抛错、不缺组件。
 *
 * 画廊与「演示专用代码」的区别就在这里被测住：每张卡片里是 SchemaRenderer
 * 的真实产出（.ant-input / .ant-table 等真实 antd 类名），任何一个物料渲染
 * 失败都会让卡片数或缺控件，直接红灯。
 */
import { afterEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { antdMaterials } from "@x-ac/web-design-react-antd";
import { GalleryPanel } from "../example/src/GalleryPanel";

let root: Root | null = null;
let container: HTMLDivElement | null = null;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe("组件实例画廊", () => {
  it("全部物料都渲染出实例卡片，关键 antd 控件真实出现", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root!.render(<GalleryPanel />);
    });

    const cards = container.querySelectorAll(".demo__gallery-card");
    expect(cards.length).toBe(antdMaterials.length);
    // 网格版式：每个物料一张卡，分类分组标题存在
    expect(container.querySelectorAll(".demo__gallery-cat").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".demo__gallery-grid").length).toBeGreaterThan(0);

    // 关键控件抽样：输入 / 下拉 / 表格 / 按钮 / 开关 应全部真实出现
    expect(container.querySelector(".ant-input")).toBeTruthy();
    expect(container.querySelector(".ant-select")).toBeTruthy();
    expect(container.querySelector(".ant-table")).toBeTruthy();
    expect(container.querySelector(".ant-btn")).toBeTruthy();
    expect(container.querySelector(".ant-switch")).toBeTruthy();
  });
});
