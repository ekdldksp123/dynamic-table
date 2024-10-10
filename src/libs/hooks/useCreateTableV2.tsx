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

interface IGetOnlyRowGroupGridData extends IGetGridData {
  rowGroup: ILineItemGroup[];
  valueGroup: ILineItemGroup[];
  showRowsTotal: boolean;
}

interface IGetPivotGridData extends IGetGridData {
  colGroup: ILineItemGroup[];
  rowGroup: ILineItemGroup[];
  valueGroup: ILineItemGroup[];
  showColsTotal: boolean;
  showRowsTotal: boolean;
}

interface IGetTableData extends IGetPivotGridData {
  fieldHeaders?: string[];
  groupHeaders?: ILineItemGroup[];
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

  const getPivotGridData = ({
    lineItems,
    colGroup,
    rowGroup,
    valueGroup,
    showColsTotal,
    showRowsTotal,
    amountUnit,
  }: IGetPivotGridData) => {
    rowGroup = rowGroup.map((g, i) => {
      g.index = i;
      return g;
    });

    const groupedRowData: GroupedData = groupByHierarchical(
      lineItems,
      rowGroup.map(({ id }) => id),
    );

    const groupedColData: GroupedData = groupByHierarchical(
      lineItems,
      colGroup.map(({ id }) => id),
    );

    const minColGroup = colGroup[colGroup.length - 1];
    const { groupValues: colMinGroupValues, lineItemsMap: colMinGroupLineItemsMap } = getGroupValuesAndCodes(
      lineItems,
      minColGroup.id,
    );

    const minRowGroup = rowGroup[rowGroup.length - 1];
    const { groupValues: rowMinGroupValues, lineItemsMap: rowMinGroupLineItemsMap } = getGroupValuesAndCodes(
      lineItems,
      minRowGroup.id,
    );
    const values = valueGroup.map(({ id }) => id);

    const { gridGroups: columns, columnsKeyValueMap } = transformToGridGroup({
      groupedData: groupedColData,
      groups: colGroup,
      showTotal: showColsTotal,
      minGroupValues: colMinGroupValues,
      lineItemsMap: colMinGroupLineItemsMap,
      axis: 'col',
      values,
    });

    columns.unshift(getFirstColumn(rowGroup[0]));

    const { gridGroups: rows } = transformToGridGroup({
      groupedData: groupedRowData,
      groups: rowGroup,
      showTotal: showRowsTotal,
      minGroupValues: rowMinGroupValues,
      lineItemsMap: rowMinGroupLineItemsMap,
    });

    const data = getGroupedData({ rows, columns: columnsKeyValueMap, values });

    return {
      columns,
      rows,
      data: getDataCountedInGivenUnits(data, amountUnit),
    };
  };

  const getTableData = ({
    lineItems,
    colGroup,
    rowGroup,
    valueGroup,
    amountUnit,
    showRowsTotal,
    showColsTotal,
    fieldHeaders = [],
    groupHeaders = [],
  }: IGetTableData) => {
    //행열값이 정의되어 있지 않은 경우
    if (!colGroup.length && !rowGroup.length && !valueGroup.length && lineItems.length) {
      return getBasicGridData({ lineItems, fieldHeaders, groupHeaders, amountUnit });
    }

    if (!colGroup.length && rowGroup.length && valueGroup.length && lineItems.length) {
      return getOnlyRowGroupGridData({ lineItems, rowGroup, valueGroup, showRowsTotal, amountUnit });
    }

    if (colGroup.length && rowGroup.length && valueGroup.length && lineItems.length) {
      return getPivotGridData({ lineItems, colGroup, rowGroup, valueGroup, showColsTotal, showRowsTotal, amountUnit });
    }
  };

  return { getTableData };
};
