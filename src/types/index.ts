export interface ILineItemGroup {
  groupId: string;
  name: string;
  index: number;
  axis?: Axis;
  showTotal: boolean;
}

export type Axis = 'column' | 'row';
export interface ILineItem {
  code: string;
  name: string;
  [key: string]: ItemValueType;
  base: string[];
  isCustom: boolean;
  value: string | number;
}

export type ItemValueType = string | string[] | number | boolean | null;

export type GroupedData = {
  [key: string]: GroupedData | ILineItem[];
};

export type GridColumnDef = {
  headerName?: string;
  field?: string;
  children?: GridColumnDef[];
};

export type GridRowData = {
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
  contents?: unknown;
  showRowsTotal?: boolean;
  showColsTotal?: boolean;
}
