/* eslint-disable @typescript-eslint/no-unused-vars */
import { GridColumnDef, GridRowData, GroupedData, ILineItem, ILineItemGroup, ItemValueType } from '@/types';
import { ColDef } from '@ag-grid-community/core';
import { CheckedState } from '@radix-ui/react-checkbox';

interface IGetPivotGridData {
  lineItems: ILineItem[];
  colGroup: ILineItemGroup[];
  rowGroup: ILineItemGroup[];
  showColsTotal: CheckedState;
  showRowsTotal: CheckedState;
}

interface IGetBasicGridData {
  headers: string[];
  lineItems: ILineItem[];
  lineItemGroups: ILineItemGroup[];
}

type GridColumnsData = {
  columns: GridColumnDef[];
  fields: string[];
  fieldValuesMap: Record<string, ILineItem[]>;
  total: number;
};

type ItemsWithTotal = { total: number; items: ILineItem[] };

type GroupedDataWithTotal = {
  [key: string]: GroupedDataWithTotal | ItemsWithTotal;
};

export const useCreateTable = () => {
  const getBasicGridData = ({ headers, lineItems, lineItemGroups }: IGetBasicGridData) => {
    //lineItems 그대로 뿌려준다
    const columns: GridColumnDef[] = [...headers, ...lineItemGroups].map((col: string | ILineItemGroup) => {
      return {
        headerName: typeof col === 'string' ? col : col.name,
        field: typeof col === 'string' ? col.toLowerCase() : col.groupId,
      };
    });
    columns.push({ headerName: 'Value', field: 'value' });
    columns.push({ headerName: 'LTD (Base)', field: 'base' });

    const rows = [];
    for (const item of lineItems) {
      const data: Record<string, ItemValueType> = {};
      for (const col of columns) {
        const key = (col as ColDef).field;
        if (key) {
          data[key] = item[key];
        }
      }
      data.value = item.value;
      data.base = item.base;
      rows.push(data);
    }

    return {
      columns,
      rows,
    };
  };

  const getPivotGridData = ({ lineItems, colGroup, rowGroup, showColsTotal, showRowsTotal }: IGetPivotGridData) => {
    // console.log({ colGroup, rowGroup });
    // 행과 열 그룹별로 컬럼과 행을 구성

    const groupedColumnData: GroupedData = groupByHierarchical(
      lineItems,
      colGroup.map(({ groupId }) => groupId),
    );

    const groupedRowData: GroupedData = groupByHierarchical(
      lineItems,
      rowGroup.map(({ groupId }) => groupId),
    );
    console.log({ groupedRowData });

    const { columns, fields, fieldValuesMap, total } = transformToGridColumnsData(groupedColumnData);
    console.log({ columns, fieldValuesMap });
    const firstRowName = rowGroup[0].name.startsWith('Group') ? '구분' : rowGroup[0].name;
    columns.unshift({ field: firstRowName });

    if (showColsTotal) {
      columns.push({ headerName: 'Total', field: 'total' });
      fields.push('total');
    }

    const { groupValues, lineItemCodesMap } = getGroupValuesAndCodes(lineItems, rowGroup[0].groupId);

    // console.log({ groupValues, lineItemCodesMap });

    const rows: GridRowData[] = Array.from({ length: groupValues.length }, (_, i) => {
      const mapKey = groupValues[i] as unknown as Exclude<ItemValueType, string[] | boolean | null | undefined>;
      const codes = lineItemCodesMap[mapKey];
      const row = { [firstRowName]: groupValues[i] };

      for (const field of fields) {
        const fieldValue = fieldValuesMap[field]?.find((v) => codes.includes(v.code));
        if (typeof field === 'string' && fieldValue) {
          row[field] = fieldValue.value;
        } else if (field === 'total') {
          const totalKey = groupValues[i] as unknown as Exclude<ItemValueType, string[] | boolean | null | undefined>;
          row[field] = (groupedRowData[totalKey] as ILineItem[]).reduce(
            (sum, item) => sum + Number(item.value ?? 0),
            0,
          );
        }
      }

      return row;
    });

    if (showRowsTotal) {
      const row: GridRowData = { [firstRowName]: 'Total' };
      for (const field of fields) {
        const items = fieldValuesMap[field];
        if (items) {
          const sum = fieldValuesMap[field].reduce((sum, item) => sum + Number(item.value ?? 0), 0);
          row[field] = sum;
        } else {
          row.total = total;
        }
      }
      rows.push(row);
    }

    console.log({ columns, rows });
    return {
      columns,
      rows,
    };
  };

  //주어진 그룹의 유니크한 값과 그 값에 해당하는 아이템 코드 구하기
  const getGroupValuesAndCodes = (lineItems: ILineItem[], groupId: string) => {
    const groupValues: ItemValueType[] = [];
    const lineItemCodesMap: Record<string, ItemValueType[]> = {};

    for (const item of lineItems) {
      const itemValue = item[groupId] as unknown as Exclude<ItemValueType, boolean | string[] | null | undefined>;

      if (!groupValues.includes(itemValue)) {
        groupValues.push(itemValue);
        lineItemCodesMap[itemValue] = [item.code];
      } else {
        lineItemCodesMap[itemValue] = [...lineItemCodesMap[itemValue], item.code];
      }
    }
    return { groupValues, lineItemCodesMap };
  };

  // 계층 구조 그루핑하기
  const groupByHierarchical = (data: ILineItem[], keys: (keyof ILineItem)[]): GroupedData => {
    const groupByRecursively = (items: ILineItem[], remainingKeys: (keyof ILineItem)[]): GroupedData | ILineItem[] => {
      if (remainingKeys.length === 0) {
        return items;
      }
      const [currentKey, ...nextKeys] = remainingKeys;
      return items.reduce((result, item) => {
        const groupKey = item[currentKey] as unknown as Exclude<ItemValueType, boolean | string[] | null | undefined>;
        if (!result[groupKey]) {
          result[groupKey] = [];
        }
        (result[groupKey] as ILineItem[]).push(item);
        return result;
      }, {} as GroupedData);
    };

    const nestedGroupBy = (groupedData: GroupedData, keys: (keyof ILineItem)[]): GroupedData => {
      if (keys.length === 0) return groupedData;
      const [currentKey, ...nextKeys] = keys;
      for (const key in groupedData) {
        if (Array.isArray(groupedData[key])) {
          groupedData[key] = groupByRecursively(groupedData[key] as ILineItem[], [currentKey]);
          nestedGroupBy(groupedData[key] as GroupedData, nextKeys);
        }
      }
      return groupedData;
    };

    const initialGroup = groupByRecursively(data, [keys[0]]);
    return nestedGroupBy(initialGroup as GroupedData, keys.slice(1));
  };

  // 그룹핑된 데이터로 테이블 컬럼, 값 필드, 그룹에 해당하는 값 배열 추출하기
  const transformToGridColumnsData = (groupedData: GroupedData): GridColumnsData => {
    const columnDefs: GridColumnDef[] = [];
    const fields: string[] = [];
    const fieldValuesMap: Record<string, ILineItem[]> = {};
    let total = 0;

    const traverse = (data: GroupedData | ILineItem[], parentName: string | null): GridColumnDef[] => {
      if (Array.isArray(data)) {
        if (parentName) {
          fieldValuesMap[parentName] = [...data];

          for (const item of data) {
            if (item.value) total += Number(item.value);
          }
        }
        return [];
      }

      return Object.keys(data).map((key) => {
        const childName = parentName ? `${parentName}_${key}` : key;
        const children = traverse(data[key], childName);
        const fieldName = children.length ? undefined : childName;
        const columnDef: GridColumnDef = {
          headerName: key,
          field: fieldName,
          children: children.length ? children : undefined,
        };

        if (fieldName) fields.push(fieldName);

        return columnDef;
      });
    };

    columnDefs.push(...traverse(groupedData, null));

    return { columns: columnDefs, fields, fieldValuesMap, total };
  };

  const calculateTotals = (groupedData: GroupedData): GroupedDataWithTotal => {
    const recur = (data: GroupedData | ILineItem[]): GroupedDataWithTotal | ItemsWithTotal => {
      if (Array.isArray(data)) {
        const total = data.reduce((sum, item) => sum + Number(item.value), 0);
        return { total, items: data };
      }

      const result: GroupedDataWithTotal = {};
      for (const key in data) {
        result[key] = recur(data[key] as GroupedData | ILineItem[]);
      }

      const total = Object.values(result).reduce((sum, group) => {
        if ('total' in group) {
          return sum + Number(group.total);
        }
        return sum;
      }, 0);

      (result as unknown as ItemsWithTotal).total = total;
      return result;
    };

    return recur(groupedData) as GroupedDataWithTotal;
  };

  return { getBasicGridData, getPivotGridData };
};
