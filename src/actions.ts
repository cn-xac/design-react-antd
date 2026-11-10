/**
 * 动作执行器的 Ant Design 适配：消息与确认框。
 * 核心逻辑在 @x-ac/web-design-core / @x-ac/web-design-react，这里只提供宿主能力。
 *
 * antd 6 仍支持静态 message.xxx / Modal.confirm，但静态方法脱离 React context，
 * 拿不到 ConfigProvider 的主题。若宿主用了 <App> 包裹，可通过 setAntdAppContext
 * 注入 App.useApp() 的实例，让消息走 context 版本（推荐）；未注入时回落静态方法，
 * 保证纯渲染器 / 无 Provider 场景也能正常提示。
 */
import { App, Modal, message as antdMessage } from "antd";
import { runActions as runCoreActions } from "@x-ac/web-design-core";
import type { ActionAdapter, ActionContext, ActionNotifyType, ActionSchema } from "@x-ac/web-design-core";

type AppContext = ReturnType<typeof App.useApp>;

let appContext: AppContext | null = null;

/** 宿主在 <App> 内部调用一次即可（见 README 的 AntdAppBridge） */
export function setAntdAppContext(ctx: AppContext | null): void {
  appContext = ctx;
}

export const antdActionAdapter: ActionAdapter = {
  notify: (message: string, type: ActionNotifyType) => {
    if (appContext) {
      appContext.message.open({ type, content: message });
      return;
    }
    // 静态回落：无 Provider 时仍可用（antd 6 静态 API 保留）
    antdMessage.open({ type, content: message });
  },
  confirm: async (message: string, title = "请确认") => {
    if (appContext) {
      const confirmed = await appContext.modal.confirm({
        title,
        content: message,
        okText: "确定",
        cancelText: "取消",
      });
      return Boolean(confirmed);
    }
    // antd 静态 Modal.confirm 不返回 Promise，用 onOk / onCancel 回调决议
    return new Promise<boolean>((resolve) => {
      Modal.confirm({
        title,
        content: message,
        okText: "确定",
        cancelText: "取消",
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  },
};

export interface AntdActionContext extends Omit<ActionContext, "adapter"> {
  adapter?: ActionAdapter;
}

export function runActions(actions: ActionSchema[], ctx: AntdActionContext): Promise<void> {
  return runCoreActions(actions, { ...ctx, adapter: ctx.adapter ?? antdActionAdapter });
}

export type { ActionAdapter, ActionNotifyType };
