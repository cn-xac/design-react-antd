/**
 * jsdom 环境补丁：antd 6 的响应式组件依赖 matchMedia / ResizeObserver / IntersectionObserver，
 * jsdom 未实现，统一打桩，避免用例里出现无关的 React 警告。
 */
import { vi } from "vitest";

// React 19 的 act() 需要这个环境标志，否则会刷 "not configured to support act" 警告
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
  if (!("ResizeObserver" in globalThis)) {
    globalThis.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    } as unknown as typeof ResizeObserver;
  }
  if (!("IntersectionObserver" in globalThis)) {
    globalThis.IntersectionObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    } as unknown as typeof IntersectionObserver;
  }
  if (typeof URL.createObjectURL !== "function") {
    URL.createObjectURL = () => "blob:mock";
    URL.revokeObjectURL = () => undefined;
  }
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
}
