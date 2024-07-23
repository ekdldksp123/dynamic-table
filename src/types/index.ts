export interface ILineItemGroup {
  groupId: string;
  name: string;
  index: number;
  axis?: Axis;
  show_totals?: boolean;
}

export type Axis = 'column' | 'row';
export interface ILineItem {
  code: string;
  name: string;
  [key: string]: GroupItemValue;
  base: string[];
  isCustom: boolean;
  value: string | number;
}

export type GroupItemValue = string | string[] | number | boolean | null;

export type GroupedData = {
  [key: string]: GroupedData | ILineItem[];
};

export type GridColumnDef = {
  headerName: string;
  field?: string;
  children?: GridColumnDef[];
};

export interface IReport {
  id: number;
  name: string;
  created_at?: string;
  items: ILineItem[];
  contents?: unknown;
}
