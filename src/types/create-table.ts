import { ILineItem, ILineItemGroup } from '@/types';
import { CheckedState } from '@radix-ui/react-checkbox';

export interface IGetPivotGridData {
  lineItems: ILineItem[];
  colGroup: ILineItemGroup[];
  rowGroup: ILineItemGroup[];
  showColsTotal: CheckedState;
  showRowsTotal: CheckedState;
  showBaseTotal: CheckedState;
}

export interface IGetBasicGridData {
  headers: string[];
  lineItems: ILineItem[];
  lineItemGroups: ILineItemGroup[];
  showRowsTotal: CheckedState;
  showBaseTotal: CheckedState;
}

export interface IGetOnlyRowGroupGridData {
  headers: string[];
  rowGroup: ILineItemGroup[];
  lineItems: ILineItem[];
  lineItemGroups: ILineItemGroup[];
  showRowsTotal: CheckedState;
  showBaseTotal: CheckedState;
}
