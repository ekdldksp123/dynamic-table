import { GridData, GridGroup, ILineItem, ILineItemGroup } from '@/types/create-table.v2';
import { getDataCountedInGivenUnits } from '../custom-grid.helper';

interface IGetGridData {
  lineItems: ILineItem[];
  amountUnit: number;
}

interface IGetBasicGridData extends IGetGridData {
  groupHeaders: ILineItemGroup[];
  fieldHeaders: string[];
}

export const useCreateTableV2 = () => {
  const getBasicGridData = ({ fieldHeaders, groupHeaders, lineItems, amountUnit }: IGetBasicGridData) => {
    if (!fieldHeaders.length) {
      return {
        columns: [],
        rows: [],
        data: [],
      };
    }

    const columns: GridGroup[] = [...fieldHeaders, ...groupHeaders]
      .filter((col) => (typeof col === 'object' ? col.id !== 'id' : col))
      .map((col: string | ILineItemGroup) => {
        const isColString = typeof col === 'string';
        const key = isColString ? col : col.id;
        const title = isColString ? key : col.name;

        return {
          title,
          key,
          show: true,
        };
      });

    const data: GridData[] = [];
    for (const item of lineItems) {
      const row: GridData = {};
      for (const col of columns) {
        const key = col.key;
        if (item[key] !== undefined) {
          row[key] = item[key];
        }
      }
      data.push(row);
    }

    return { columns, rows: [], data: getDataCountedInGivenUnits(data, amountUnit) };
  };
};
