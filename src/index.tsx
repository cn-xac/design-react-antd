/**
 * @x-ac/web-design-react-antd —— Ant Design 6 适配包。
 *
 * 提供四样东西（与 @x-ac/web-design-vue-element-plus 对称）：
 * 1. components：协议物料名（ec-input）→ antd 组件；
 * 2. materials：物料元数据（core 通用清单 + antd 专有属性/物料）；
 * 3. designer：设计器自身 UI 的完整控件表（属性设置面板即用这些已注册组件）；
 * 4. actions：消息 / 确认框副作用 + 绑定通道（value / onChange）。
 *
 * 引擎（@x-ac/web-design-react）只提供架构：整合已注册组件形成设计器与渲染器；
 * 渲染器只消费组件、导出数据、派发事件，不含 UI 库知识。
 */
import "./styles.css";
import { defineReactAdapter, createDesignerKit } from "@x-ac/web-design-react/kit";
import type { DesignerKit, UiAdapter } from "@x-ac/web-design-core";
import { ANTD_COMPONENTS, type AntdControl } from "./components";
import { antdMaterials } from "./materials";
import { antdDesignerKit } from "./designer";
import { antdActionAdapter } from "./actions";

/**
 * designer kit 的控件契约（DesignerControlProps）与渲染物料契约（ControlProps）不同，
 * 但 UiAdapter 用同一个泛型描述两者；EP 适配层同样用一次收窄转换处理，属协议既定做法。
 */
const designerKit = createDesignerKit(antdDesignerKit) as unknown as DesignerKit<AntdControl>;

export const antdAdapter: UiAdapter<AntdControl> = defineReactAdapter<AntdControl>({
  name: "ant-design",
  components: ANTD_COMPONENTS,
  materials: antdMaterials,
  designer: designerKit,
  actions: antdActionAdapter,
});

export { ANTD_COMPONENTS, type AntdControl } from "./components";
export { antdMaterials, ANTD_FIELD_PATCHES, ANTD_EXTRA_MATERIALS } from "./materials";
export { antdDesignerKit } from "./designer";
export { antdActionAdapter, runActions, setAntdAppContext } from "./actions";
export type { AntdActionContext } from "./actions";
export { AntdAppBridge, AntdConfigProvider } from "./app";
export { missingComponents } from "@x-ac/web-design-core";
