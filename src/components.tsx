/**
 * Ant Design 物料实现：协议物料名（ec-input）→ antd 组件。
 *
 * 归一化契约（与 react 引擎的 ControlProps 对齐）：
 * - 受控通道由 REACT_BINDING 声明为 `value` + `onChange`；
 * - 渲染器写回 scope 时取 **onChange 的第一个参数**，所以这里必须把 antd 的
 *   原生事件/复合参数翻译成「值」：Input 取 e.target.value、DatePicker 取日期字符串、
 *   Checkbox.Group 取数组、Switch 取 boolean。绝对不能直接把 event 透传出去。
 * - 其余 Schema 属性由渲染器原样透传（options / placeholder / disabled / style ...），
 *   组件按需取用，不认识的属性忽略，避免 React 把未知属性打到 DOM 上。
 */
import type { CSSProperties, ReactNode } from "react";
import { parseOptions, prefixedComponents } from "@x-ac/design-core";
import {
  Alert,
  Button,
  Card,
  Cascader,
  Checkbox,
  ColorPicker,
  DatePicker,
  Divider,
  Image,
  Input,
  InputNumber,
  Radio,
  Rate,
  Segmented,
  Select,
  Slider,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";

/** 渲染器透传的属性集合；比 core 的 ControlProps 更贴近实际透传内容 */
export interface AntdControlProps {
  value?: unknown;
  onChange?: (value: unknown) => void;
  onBlur?: () => void;
  onClick?: () => void;
  placeholder?: string;
  disabled?: boolean;
  options?: unknown;
  children?: ReactNode;
  style?: CSSProperties;
  [key: string]: unknown;
}

type Control = (props: AntdControlProps) => ReactNode;

const str = (value: unknown): string => (value === undefined || value === null ? "" : String(value));
const bool = (value: unknown): boolean => Boolean(value);
const num = (value: unknown): number | undefined =>
  value === undefined || value === null || value === "" ? undefined : Number(value);
const optionsOf = (raw: unknown) => parseOptions(raw).map((item) => ({ label: item.label, value: item.value }));

/* ---------------- 展示 / 布局 ---------------- */

const Container = ({ children, style, onClick }: AntdControlProps) => (
  <div className="antd-container" style={style} onClick={onClick}>
    {children}
  </div>
);

const Grid = ({ children, style, columns }: AntdControlProps) => {
  const count = Math.max(1, Number(columns) || 2);
  return (
    <div
      className="antd-grid"
      style={{ ...style, display: "grid", gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`, gap: 12 }}
    >
      {children}
    </div>
  );
};

const CardBlock = ({ children, style, title, extra, onClick }: AntdControlProps) => (
  <Card
    size="small"
    title={str(title) || undefined}
    extra={str(extra) || undefined}
    style={style}
    onClick={onClick}
  >
    {children}
  </Card>
);

const SpaceBlock = ({ children, style }: AntdControlProps) => (
  <Space wrap style={style}>
    {children}
  </Space>
);

const Title = ({ children, style, level }: AntdControlProps) => (
  <Typography.Title level={(Number(level) || 3) as 1 | 2 | 3 | 4 | 5} style={style}>
    {children}
  </Typography.Title>
);

const Text = ({ children, style }: AntdControlProps) => (
  <Typography.Paragraph style={style}>{children}</Typography.Paragraph>
);

const DividerBlock = ({ children, style, dashed }: AntdControlProps) => (
  <Divider dashed={bool(dashed)} style={style}>
    {children || undefined}
  </Divider>
);

const TagBlock = ({ children, style, color }: AntdControlProps) => (
  <Tag color={str(color) || undefined} style={style}>
    {children}
  </Tag>
);

const AlertBlock = ({ style, type, message, description, children }: AntdControlProps) => (
  <Alert
    style={style}
    type={(["success", "info", "warning", "error"].includes(str(type)) ? str(type) : "info") as
      | "success"
      | "info"
      | "warning"
      | "error"}
    // antd 6 起 Alert 的 message 已弃用，改用 title（同时兼容 Schema 里旧写法）
    title={str(message) || (typeof children === "string" ? children : undefined) || undefined}
    description={str(description) || undefined}
  />
);

const Link = ({ children, style, href, target }: AntdControlProps) => (
  <Typography.Link href={str(href) || "#"} target={str(target) || undefined} style={style}>
    {children}
  </Typography.Link>
);

function Picture({ style, src, alt, width, height }: AntdControlProps) {
  const url = str(src);
  // 空 src 会让浏览器把当前页再请求一遍（antd/浏览器都会警告），空值时只给占位
  if (!url) {
    return (
      <div className="antd-image-placeholder" style={{ ...style, width: num(width) ?? 96, height: num(height) ?? 64 }}>
        {str(alt) || "图片"}
      </div>
    );
  }
  return <Image src={url} alt={str(alt)} width={num(width)} height={num(height)} style={style} />;
}

interface ColumnItem {
  label: string;
  prop: string;
}

function columnsOf(raw: unknown): ColumnItem[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      const record = (item ?? {}) as Record<string, unknown>;
      return { label: str(record.label ?? record.prop), prop: str(record.prop ?? record.label) };
    });
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const [label, prop] = pair.split(":").map((part) => part.trim());
        return { label: label || prop || "", prop: prop || label || "" };
      });
  }
  return [];
}

const TableBlock = ({ style, columns, data, rows, emptyText }: AntdControlProps) => {
  const cols = columnsOf(columns).map((item) => ({ title: item.label, dataIndex: item.prop, key: item.prop }));
  const list = Array.isArray(data) ? data : Array.isArray(rows) ? rows : [];
  // antd 6 弃用了 rowKey 回调的 index 参数；这里用数据行自带的稳定 key
  const dataSource = (list as Record<string, unknown>[]).map((row, index) => ({
    ...row,
    __rowKey: typeof row === "object" && row !== null ? String((row as Record<string, unknown>).key ?? index) : String(index),
  }));
  return (
    <Table
      style={style}
      size="small"
      pagination={false}
      columns={cols}
      dataSource={dataSource}
      rowKey="__rowKey"
      locale={{ emptyText: str(emptyText) || "暂无数据" }}
    />
  );
};

/* ---------------- 表单控件 ---------------- */

function TextField({
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  style,
  type,
  maxlength,
  showCount,
  rows,
}: AntdControlProps) {
  const common = {
    value: str(value),
    placeholder,
    disabled: bool(disabled),
    style,
    onBlur,
    maxLength: num(maxlength),
  };
  // textarea 由 rows 或 Schema 的 type=textarea 判定（core 的 ec-textarea 也走这里）
  if (Number(rows) > 0 || str(type) === "textarea") {
    return (
      <Input.TextArea
        {...common}
        rows={Number(rows) || 3}
        showCount={bool(showCount)}
        onChange={(event) => onChange?.(event.target.value)}
      />
    );
  }
  return <Input {...common} type={str(type) || "text"} onChange={(event) => onChange?.(event.target.value)} />;
}

const NumberField = ({ value, onChange, onBlur, placeholder, disabled, style, min, max, precision, step }: AntdControlProps) => (
  <InputNumber
    value={num(value) ?? null}
    placeholder={placeholder}
    disabled={bool(disabled)}
    style={{ ...style, width: style?.width ?? "100%" }}
    min={num(min)}
    max={num(max)}
    precision={num(precision)}
    step={num(step)}
    onBlur={onBlur}
    onChange={(next) => onChange?.(next ?? "")}
  />
);

const SelectField = ({ value, onChange, onBlur, placeholder, disabled, style, options, clearable, showSearch, mode }: AntdControlProps) => (
  <Select
    value={str(value) || undefined}
    placeholder={placeholder}
    disabled={bool(disabled)}
    style={{ ...style, width: style?.width ?? "100%" }}
    options={optionsOf(options)}
    allowClear={bool(clearable)}
    showSearch={bool(showSearch)}
    mode={str(mode) === "multiple" ? "multiple" : str(mode) === "tags" ? "tags" : undefined}
    onBlur={onBlur}
    onChange={(next) => onChange?.(next ?? "")}
  />
);

const RadioField = ({ value, onChange, disabled, style, options }: AntdControlProps) => (
  <Radio.Group
    value={str(value)}
    disabled={bool(disabled)}
    style={style}
    options={optionsOf(options)}
    onChange={(event) => onChange?.(event.target.value)}
  />
);

const CheckboxField = ({ value, onChange, disabled, style, options }: AntdControlProps) => (
  <Checkbox.Group
    value={Array.isArray(value) ? (value as string[]) : []}
    disabled={bool(disabled)}
    style={style}
    options={optionsOf(options)}
    onChange={(next) => onChange?.(next)}
  />
);

const SwitchField = ({ value, onChange, disabled, style, activeText, inactiveText }: AntdControlProps) => (
  <Switch
    checked={bool(value)}
    disabled={bool(disabled)}
    style={style}
    checkedChildren={str(activeText) || undefined}
    unCheckedChildren={str(inactiveText) || undefined}
    onChange={(next) => onChange?.(next)}
  />
);

/** 日期：antd 要 Dayjs，写回 scope 用字符串，避免把 Dayjs 对象塞进数据 */
function DateField({ value, onChange, onBlur, placeholder, disabled, style, type, valueFormat }: AntdControlProps) {
  const format = str(valueFormat) || "YYYY-MM-DD";
  const parsed = str(value) ? dayjs(str(value)) : null;
  const common = {
    disabled: bool(disabled),
    style: { ...style, width: style?.width ?? "100%" },
    format,
    onBlur,
  };
  if (str(type) === "daterange") {
    const range = Array.isArray(value) ? (value as string[]) : [];
    return (
      <DatePicker.RangePicker
        {...common}
        placeholder={[placeholder ?? "开始日期", placeholder ?? "结束日期"]}
        value={range.length === 2 && range[0] && range[1] ? [dayjs(range[0]), dayjs(range[1])] : null}
        onChange={(_dates, strings) => onChange?.(strings)}
      />
    );
  }
  return (
    <DatePicker
      {...common}
      placeholder={placeholder}
      picker={str(type) === "month" ? "month" : "date"}
      showTime={str(type) === "datetime"}
      value={parsed?.isValid() ? parsed : null}
      onChange={(_date, text) => onChange?.(text)}
    />
  );
}

const RateField = ({ value, onChange, disabled, style, count, allowHalf }: AntdControlProps) => (
  <Rate
    value={num(value) ?? 0}
    disabled={bool(disabled)}
    style={style}
    count={num(count)}
    allowHalf={bool(allowHalf)}
    onChange={(next) => onChange?.(next)}
  />
);

const SliderField = ({ value, onChange, disabled, style, min, max, step }: AntdControlProps) => (
  <Slider
    value={num(value) ?? 0}
    disabled={bool(disabled)}
    style={style}
    min={num(min)}
    max={num(max)}
    step={num(step)}
    onChange={(next) => onChange?.(next)}
  />
);

const SegmentedField = ({ value, onChange, disabled, style, options }: AntdControlProps) => (
  <Segmented
    value={str(value)}
    disabled={bool(disabled)}
    style={style}
    options={optionsOf(options)}
    onChange={(next) => onChange?.(next)}
  />
);

const ColorField = ({ value, onChange, disabled, style, showAlpha }: AntdControlProps) => (
  <ColorPicker
    value={str(value) || undefined}
    disabled={bool(disabled)}
    style={style}
    disabledAlpha={!bool(showAlpha)}
    showText
    onChange={(_color, css) => onChange?.(css)}
  />
);

const CascaderField = ({ value, onChange, placeholder, disabled, style, options, clearable }: AntdControlProps) => (
  <Cascader
    value={Array.isArray(value) ? (value as string[]) : undefined}
    placeholder={placeholder}
    disabled={bool(disabled)}
    style={{ ...style, width: style?.width ?? "100%" }}
    options={optionsOf(options)}
    allowClear={bool(clearable)}
    onChange={(next) => onChange?.(next)}
  />
);

/* ---------------- core 业务语义物料 ---------------- */
/* core 清单里带业务语义的三个协议物料，用 antd 基础控件落地，避免适配层出现置灰缺口。
   业务系统若有专用组织树 / 字典服务，可用 registerMaterials() 覆盖同名实现。 */

const OrgPickerField = ({ value, onChange, placeholder, disabled, style }: AntdControlProps) => (
  <Input
    value={str(value)}
    placeholder={placeholder ?? "请选择组织"}
    disabled={bool(disabled)}
    readOnly
    style={style}
    suffix={<span aria-hidden="true">⋯</span>}
    onClick={() => onChange?.(str(value))}
  />
);

const DictSelectField = ({ value, onChange, placeholder, disabled, style, options, clearable, dictKey }: AntdControlProps) => (
  <Select
    value={str(value) || undefined}
    placeholder={placeholder ?? "请选择"}
    disabled={bool(disabled)}
    style={{ ...style, width: style?.width ?? "100%" }}
    options={optionsOf(options)}
    allowClear={clearable === undefined ? true : bool(clearable)}
    onChange={(next) => onChange?.(next ?? "")}
    aria-label={str(dictKey) || undefined}
  />
);

const AmountField = ({ value, onChange, onBlur, placeholder, disabled, style, min, max, precision, currency }: AntdControlProps) => (
  <InputNumber
    value={num(value) ?? null}
    placeholder={placeholder ?? "请输入金额"}
    disabled={bool(disabled)}
    style={{ ...style, width: style?.width ?? "100%" }}
    min={num(min)}
    max={num(max)}
    precision={num(precision) ?? 2}
    prefix={str(currency) || "¥"}
    onBlur={onBlur}
    onChange={(next) => onChange?.(next ?? "")}
  />
);

const ButtonBlock = ({ children, onClick, disabled, style, type, danger }: AntdControlProps) => {
  const t = str(type);
  return (
    <Button
      type={(t === "primary" || t === "text" || t === "link" || t === "dashed" ? t : "default") as
        | "primary"
        | "text"
        | "link"
        | "dashed"
        | "default"}
      danger={bool(danger) || t === "danger"}
      disabled={bool(disabled)}
      style={style}
      onClick={onClick}
    >
      {children ?? "按钮"}
    </Button>
  );
};

/** 裸名 → 协议名由 core 的 prefixedComponents 统一处理，保证与 Schema 的 ec-* 一致 */
export const ANTD_COMPONENTS = prefixedComponents<Control>({
  container: Container,
  grid: Grid,
  card: CardBlock,
  space: SpaceBlock,
  title: Title,
  text: Text,
  divider: DividerBlock,
  tag: TagBlock,
  alert: AlertBlock,
  image: Picture,
  table: TableBlock,
  link: Link,
  input: TextField,
  textarea: TextField,
  number: NumberField,
  select: SelectField,
  radio: RadioField,
  checkbox: CheckboxField,
  switch: SwitchField,
  date: DateField,
  rate: RateField,
  slider: SliderField,
  button: ButtonBlock,
  segmented: SegmentedField,
  color: ColorField,
  cascader: CascaderField,
  "org-picker": OrgPickerField,
  "dict-select": DictSelectField,
  "amount-input": AmountField,
});

export type { Control as AntdControl };
