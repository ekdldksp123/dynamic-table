export type ItemValueType = string | string[] | number | boolean | null | undefined;

export type GroupType = 'column' | 'row' | 'value';

export interface ILineItem {
  id?: number;
  [key: string]: ItemValueType;
  base: string;
}

export interface ILineItemGroup {
  id: string;
  name: string;
  level?: number;
  type?: GroupType;
  showTotal: boolean;
  index?: number;
}

export type LineItemKey = keyof ILineItem;

export type KeyTypeFromItemValue = Exclude<ItemValueType, string[] | boolean | null | undefined | number>;

export interface IReportConfig {
  id: string;
  name: string;
  items: ILineItem[];
  groups: ILineItemGroup[];
  rowGroup: ILineItemGroup[];
  colGroup: ILineItemGroup[];
  valueGroup: ILineItemGroup[];
  showRowsTotal: boolean;
  showColsTotal: boolean;
}

export type GridGroup = {
  title: string;
  key: string;
  index?: number;
  children?: GridGroup[];
  items?: ILineItem[];
  order?: number;
  colSpan?: number;
};

export type GridData = {
  division?: string;
  [key: string]: ItemValueType;
};
