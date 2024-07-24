/* eslint-disable @typescript-eslint/no-unused-vars */
import { GridRowData, GroupedData, ILineItem, ILineItemGroup, ItemValueType, Subtotals } from '@/types';
import { CheckedState } from '@radix-ui/react-checkbox';
import { ColumnDef } from '@tanstack/react-table';

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
  columns: ColumnDef<GridRowData>[];
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
    const columns: ColumnDef<GridRowData>[] = [...headers, ...lineItemGroups].map((col: string | ILineItemGroup) => {
      const key = typeof col === 'string' ? col.toLowerCase() : col.groupId;

      return {
        header: typeof col === 'string' ? col : col.name,
        accessorKey: key,
        id: key, // Use `id` to identify the column
        accessorFn: (row) => row[key],
      };
    });
    columns.push({ header: 'Value', accessorKey: 'value' });
    columns.push({ header: 'LTD (Base)', accessorKey: 'base' });

    const rows = [];
    for (const item of lineItems) {
      const data: Record<string, ItemValueType> = {};
      for (const col of columns) {
        const key = col.id;
        if (key) {
          data[key] = item[key];
        }
      }
      data.value = item.value;
      data.base = item.base;
      rows.push(data);
    }
    // console.log({ columns, rows });

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
    // console.log({ groupedColumnData });

    const subtotals = calculateSubtotals(groupedColumnData);
    console.log({ subtotals });

    const { columns, fieldValuesMap, total } = transformToGridColumnsData(groupedColumnData);

    const fields = Object.keys(fieldValuesMap);
    const firstRowName = rowGroup[0].name.startsWith('Group') ? '구분' : rowGroup[0].name;
    columns.unshift({ accessorKey: 'division', header: firstRowName });

    if (showColsTotal) {
      columns.push({ header: 'Total', accessorKey: 'total' });
      fields.push('total');
    }

    // console.log({ fieldValuesMap });

    const { groupValues, lineItemCodesMap } = getGroupValuesAndCodes(lineItems, rowGroup[0].groupId);

    // console.log({ groupValues, lineItemCodesMap });

    const rows: GridRowData[] = Array.from({ length: groupValues.length }, (_, i) => {
      const mapKey = groupValues[i] as unknown as Exclude<ItemValueType, string[] | boolean | null | undefined>;
      const codes = lineItemCodesMap[mapKey];
      const row: GridRowData = { division: groupValues[i] };

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
      const row: GridRowData = { division: 'Total' };
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

    // console.log({ columns, rows });
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
    const columnDefs: ColumnDef<GridRowData>[] = [];
    const fieldValuesMap: Record<string, ILineItem[]> = {};
    let total = 0;

    const traverse = (data: GroupedData | ILineItem[], parentName: string | null): ColumnDef<GridRowData>[] => {
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
        const columnDef: ColumnDef<GridRowData> = {
          header: `${key.charAt(0).toUpperCase()}${key.slice(1)}`,
          accessorKey: parentName ? childName : undefined,
          columns: children.length ? children : undefined,
        };

        return columnDef;
      });
    };

    columnDefs.push(...traverse(groupedData, null));

    return { columns: columnDefs, fieldValuesMap, total };
  };

  // const calculateTotals = (groupedData: GroupedData): GroupedDataWithTotal => {
  //   const recur = (data: GroupedData | ILineItem[]): GroupedDataWithTotal | ItemsWithTotal => {
  //     if (Array.isArray(data)) {
  //       const total = data.reduce((sum, item) => sum + Number(item.value), 0);
  //       return { total, items: data };
  //     }

  //     const result: GroupedDataWithTotal = {};
  //     for (const key in data) {
  //       result[key] = recur(data[key] as GroupedData | ILineItem[]);
  //     }

  //     const total = Object.values(result).reduce((sum, group) => {
  //       if ('total' in group) {
  //         return sum + Number(group.total);
  //       }
  //       return sum;
  //     }, 0);

  //     (result as unknown as ItemsWithTotal).total = total;
  //     return result;
  //   };

  //   return recur(groupedData) as GroupedDataWithTotal;
  // };

  const calculateSubtotals = (data: GroupedData): Subtotals => {
    const result: { [key: string]: { [name: string]: number } } = {};

    const addValue = (map: { [name: string]: number }, index: number, value: number) => {
      if (!map[index]) {
        map[index] = 0;
      }
      map[index] += value;
    };

    for (const purpose in data) {
      const purposeData = data[purpose];
      if (typeof purposeData !== 'object' || Array.isArray(purposeData)) continue;

      for (const assetType in purposeData) {
        const items = purposeData[assetType] as ILineItem[];
        if (!result[assetType]) {
          result[assetType] = {};
        }

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const value = typeof item.value === 'number' ? item.value : parseFloat(item.value || '0');
          addValue(result[assetType], i, value);
        }
      }
    }

    const subtotals: Subtotals = {};
    for (const assetType in result) {
      const subtotalList = Object.values(result[assetType]).map((total) => ({ subtotal: total }));
      subtotals[assetType] = subtotalList;
    }

    return subtotals;
  };

  return { getBasicGridData, getPivotGridData };
};
