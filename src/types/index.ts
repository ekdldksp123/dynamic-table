import { CheckedState } from '@radix-ui/react-checkbox';

export interface ILineItemGroup {
  groupId: string;
  name: string;
  level: number;
  axis?: Axis;
  showTotal: boolean;
}
export type Axis = 'column' | 'row';
export interface ILineItem {
  [key: string]: ItemValueType;
  base: string[];
  customFields?: string[];
  value?: number; //LTD (Base) - 당기, 당기말
}

export type LineItemKey = keyof ILineItem;

export interface ILineItemColumnDisplayOrNot {
  [key: LineItemKey]: boolean | undefined;
}

export type ItemValueType = string | string[] | number | boolean | null | undefined;

export type KeyTypeFromItemValue = Exclude<ItemValueType, string[] | boolean | null | undefined>;

export type GroupedData = {
  [key: string]: GroupedData | ILineItem[];
};
export type Subtotals = {
  [key: string]: Subtotals | Subtotal[];
};

export type Subtotal = { subtotal: number };

export type GridColumn = {
  title: string;
  key: string;
  children?: GridColumn[];
};

export type GridRowData = {
  division?: ItemValueType;
  [key: string]: ItemValueType;
};

//보고서명, 질의 보고서 번호, 보고서 양식 고유번호 = id
export interface IReportConfig {
  id: number;
  reportQueryNo: string;
  name: string;
  created_at?: string;
  items: ILineItem[];
  itemsDisplayInfo: ILineItemColumnDisplayOrNot;
  groups?: ILineItemGroup[];
  colGroup?: ILineItemGroup[];
  rowGroup?: ILineItemGroup[];
  showRowsTotal?: CheckedState;
  showColsTotal?: CheckedState;
  showBaseTotal?: CheckedState;
  writer?: string; // 담당자
  reviewer?: string; // 결재자
  status?: string; // 작성, 미작성, 결재중, 진행중, 결재완료, 반려
  mode: 'create' | 'edit';
  useOrNot?: boolean;
}
