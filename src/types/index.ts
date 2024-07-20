export interface ILineItemGroup {
  groupId: string;
  name: string;
  index: number;
  axis?: Axis;
  show_totals?: boolean;
  // values: string | number | null[];
}

export type Axis = 'column' | 'row';
// 값
export interface ILineItem {
  code: string;
  name: string;
  [key: string]: GroupItemValue;
  base: string[];
}

export type GroupItemValue = string | string[] | number | null;
export interface IReport {
  id: number;
  name: string;
  created_at?: string;
  items: ILineItem[];
  contents: IGridData;
}

export interface IGridData {
  header: IGridHeader;
  columns: IGridColumn[];
  rows: unknown[];
}

export interface IGridHeader {
  height: number;
  complexColumns: IGridComplexColumn[];
}

export interface IGridColumn {
  header: string;
  name: string;
}

export interface IGridComplexColumn extends IGridColumn {
  childNames: string[];
}
