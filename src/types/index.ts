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
  code: string;
  name: string;
  [key: string]: ItemValueType;
  base: string[];
  customFields?: string[];
  value?: number; //LTD (Base) - 당기, 당기말
}

export type GroupedData = {
  [key: string]: GroupedData | ILineItem[];
};

export type LineItemKey = keyof ILineItem;

export interface ILineItemColumnDisplayOrNot {
  [key: LineItemKey]: boolean | undefined;
}

export type Subtotals = {
  [key: string]: Subtotals | Subtotal[];
};

export type Subtotal = { subtotal: number };

export type ItemValueType = string | string[] | number | boolean | null | undefined;

export type KeyTypeFromItemValue = Exclude<ItemValueType, string[] | boolean | null | undefined>;

// export type GridColumnDef = ColDef | ColGroupDef;

export type GridColumn = {
  title: string;
  key: string;
  children?: GridColumn[];
};

export type GridRowData = {
  division?: ItemValueType;
  [key: string]: ItemValueType;
};
export interface IReport {
  id: number;
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
  writer?: string;
  reviewer?: string;
}
