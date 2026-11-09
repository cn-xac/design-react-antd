/**
 * 可选的宿主包装：让 antd 的 message / Modal 走 App context（推荐用法）。
 *
 * antd 6 的静态 message / Modal.confirm 脱离 React context，拿不到 ConfigProvider
 * 的动态主题；官方推荐用 <App> + App.useApp()。这里提供两个组件：
 * - AntdConfigProvider：ConfigProvider + App 的组合外壳；
 * - AntdAppBridge：放在 App 内部，把 context 实例注入适配包的 actions。
 *
 * 不用也没关系：actions 会自动回落到静态 API，功能不缺失，只是主题不同步。
 */
import type { ReactNode } from "react";
import { useEffect } from "react";
import { App, ConfigProvider } from "antd";
import { setAntdAppContext } from "./actions";

export function AntdAppBridge(): null {
  const ctx = App.useApp();
  useEffect(() => {
    setAntdAppContext(ctx);
    return () => setAntdAppContext(null);
  }, [ctx]);
  return null;
}

export interface AntdConfigProviderProps {
  children?: ReactNode;
}

export function AntdConfigProvider({ children }: AntdConfigProviderProps) {
  return (
    <ConfigProvider>
      <App>
        <AntdAppBridge />
        {children}
      </App>
    </ConfigProvider>
  );
}
