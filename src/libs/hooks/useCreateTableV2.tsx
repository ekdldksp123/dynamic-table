import { GridData, GridGroup, ILineItem, ILineItemGroup } from '@/types/create-table.v2';
import {
  getDataCountedInGivenUnits,
  getFirstColumn,
  getGroupValuesAndCodes,
  getGroupedData,
  groupByHierarchical,
  transformToGridGroup,
} from '../custom-grid.helper';
import { GroupedData } from '@/types';

interface IGetGridData {
  lineItems: ILineItem[];
  amountUnit: number;
}

interface IGetBasicGridData extends IGetGridData {
  groupHeaders: ILineItemGroup[];
  fieldHeaders: string[];
}

interface IGetOnlyRowGroupGridData extends IGetBasicGridData {
  rowGroup: ILineItemGroup[];
  valueGroup: ILineItemGroup[];
  showRowsTotal: boolean;
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

  const getOnlyRowGroupGridData = ({
    lineItems,
    rowGroup,
    valueGroup,
    showRowsTotal,
    amountUnit,
  }: IGetOnlyRowGroupGridData) => {
    rowGroup = rowGroup.map((g, i) => {
      g.index = i;
      return g;
    });

    const columns: GridGroup[] = [getFirstColumn(rowGroup[0])];

    for (const { id } of valueGroup) {
      columns.push({ key: id, title: id });
    }

    const groupedRowData: GroupedData = groupByHierarchical(
      lineItems,
      rowGroup.map(({ id }) => id),
    );

    const minGroup = rowGroup[rowGroup.length - 1];
    const { groupValues, lineItemsMap } = getGroupValuesAndCodes(lineItems, minGroup.id);

    const { gridGroups: rows } = transformToGridGroup({
      groupedData: groupedRowData,
      groups: rowGroup,
      showTotal: showRowsTotal,
      minGroupValues: groupValues,
      lineItemsMap,
    });

    const values = valueGroup.map(({ id }) => id);
    const data = getGroupedData({ rows, columns: {}, values });

    return {
      columns,
      rows,
      data: getDataCountedInGivenUnits(data, amountUnit),
    };
  };

  return { getBasicGridData, getOnlyRowGroupGridData };
};
