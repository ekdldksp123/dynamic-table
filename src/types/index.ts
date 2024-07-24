import { ColDef, ColGroupDef } from '@ag-grid-community/core';

export interface ILineItemGroup {
  groupId: string;
  name: string;
  index: number;
  axis?: Axis;
  total?: number;
  showTotal: boolean;
}
export type Axis = 'column' | 'row';
export interface ILineItem {
  code: string;
  name: string;
  [key: string]: ItemValueType;
  base: string[];
  isCustom: boolean;
  value?: string | number;
}

export type GroupedData = {
  [key: string]: GroupedData | ILineItem[];
};

export type Subtotals = {
  [key: string]: Subtotals | Subtotal[];
};

export type Subtotal = { subtotal: number };

export type ItemValueType = string | string[] | number | boolean | null | undefined;

export type GridColumnDef = ColDef | ColGroupDef;

export type GridRowData = {
  division?: ItemValueType;
  [key: string]: ItemValueType;
};
export interface IReport {
  id: number;
  name: string;
  created_at?: string;
  items: ILineItem[];
  groups?: ILineItemGroup[];
  colGroup?: ILineItemGroup[];
  rowGroup?: ILineItemGroup[];
  gridOptions?: unknown;
  showRowsTotal?: boolean;
  showColsTotal?: boolean;
}
