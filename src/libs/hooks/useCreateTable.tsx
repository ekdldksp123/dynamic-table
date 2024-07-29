/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  GridColumn,
  GridRowData,
  GroupedData,
  ILineItem,
  ILineItemGroup,
  ItemValueType,
  KeyTypeFromItemValue,
  Subtotal,
  Subtotals,
} from '@/types';
import { CheckedState } from '@radix-ui/react-checkbox';
import { areStringArraysEqual } from '../utils';

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

interface IGetOnlyRowGroupGridData {
  headers: string[];
  rowGroup: ILineItemGroup[];
  lineItems: ILineItem[];
  lineItemGroups: ILineItemGroup[];
  showRowsTotal: CheckedState;
}

type GridColumnsData = {
  columns: GridColumn[];
  fieldValuesMap: Record<string, ILineItem[]>;
  total: number;
};

export const useCreateTable = () => {
  const getOnlyRowGroupGridData = ({
    headers,
    rowGroup,
    lineItems,
    lineItemGroups,
    showRowsTotal,
  }: IGetOnlyRowGroupGridData) => {
    const firstRowName = rowGroup[0].name.startsWith('Group') ? '구분' : rowGroup[0].name;
    const columns: GridColumn[] = [
      {
        title: firstRowName,
        key: 'division',
      },
    ];

    const valueColumns: GridColumn[] = [
      ...headers,
      ...lineItemGroups.filter((group) => !rowGroup.find((rowG) => rowG.groupId === group.groupId)),
    ].map((col: string | ILineItemGroup) => {
      const key = typeof col === 'string' ? col.toLowerCase() : col.groupId;
      const header = typeof col === 'string' ? (key !== 'value' ? col : lineItems[0].base[0]) : col.name;

      return {
        title: header,
        key: key,
      };
    });
    columns.push(...valueColumns);

    const groupedRowData: GroupedData = groupByHierarchical(
      lineItems,
      rowGroup.map(({ groupId }) => groupId),
    );

    const rows: GridRowData[] = extractRowsWithIndent({ groupedData: groupedRowData, valueColumns });

    if (showRowsTotal) {
      const totalRow: GridRowData = { division: 'Total', total: true };
      for (const { key } of valueColumns) {
        totalRow[key] = rows.reduce((sum, cur) => sum + (isNaN(Number(cur[key])) ? 0 : Number(cur[key])), 0);
      }
      rows.push(totalRow);
    }

    const showSubtotalGroups = rowGroup.filter((group) => group.showTotal === true);

    // if (showSubtotalGroups.length && !showRowsTotal) {
    //   //   const subtotals = calculateRowGroupSubtotals(groupedRowData);
    //   console.log({ showSubtotalGroups });
    //   for (const group of showSubtotalGroups) {
    //     calculateRowGroupSubtotals(groupedRowData, group.level);
    //   }
    // }

    // console.log({ columns, rows });

    return {
      columns,
      rows,
    };
  };

  // const calculateRowGroupSubtotals = (groupedData: GroupedData, groupLevel: number) => {

  //   const result: Record<string, Record<string, number>[]> = {}
  //   const traverse = (data: GroupedData | ILineItem[], depth: number, parentName: string) => {
  //     if (Array.isArray(data) && parentName !== '') {
  //       result[parentName].push(data.map(item => item))
  //     }
  //   };
  //   traverse(groupedData, 0, '');
  // };

  const getBasicGridData = ({ headers, lineItems, lineItemGroups }: IGetBasicGridData) => {
    //lineItems 그대로 뿌려준다

    const columns: GridColumn[] = [...headers, ...lineItemGroups].map((col: string | ILineItemGroup) => {
      const key = typeof col === 'string' ? col.toLowerCase() : col.groupId;
      const header = typeof col === 'string' ? (key !== 'value' ? col : lineItems[0].base[0]) : col.name;

      return {
        title: header,
        key: key,
      };
    });

    const rows = [];
    for (const item of lineItems) {
      const data: Record<string, ItemValueType> = {};
      for (const col of columns) {
        const key = col.key;
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

    const { columns, fieldValuesMap, total } = transformToGridColumnsData(groupedColumnData);
    const fields = Object.keys(fieldValuesMap);

    //열 그룹 소계 표시 여부 확인 및 계산 로직
    const showSubtotalGroups = colGroup.filter((group) => group.showTotal === true);
    const subtotals = calculateColGroupSubtotals(groupedColumnData);

    if (showSubtotalGroups.length) {
      const hasDuplicateKeys = checkSubgroupKeys(groupedColumnData);

      if (hasDuplicateKeys) {
        // 하위 필드가 서로 중복되면

        const minGroupLevel = Math.min(...showSubtotalGroups.map((g) => g.level));
        const minGroup = showSubtotalGroups.find((group) => group.level === minGroupLevel);

        if (minGroup) {
          const { groupValues } = getGroupValuesAndCodes(lineItems, minGroup.groupId);
          // console.log({ subtotals, groupValues });

          const subtotalKeys = Object.keys(subtotals);
          if (areStringArraysEqual(subtotalKeys, groupValues as string[])) {
            columns.push({
              key: 'subtotal',
              title: '합계',
              children: subtotalKeys.map((key) => {
                const accessorKey = `${key}_subtotal`;
                fields.push(accessorKey);
                return {
                  title: key,
                  key: accessorKey,
                };
              }),
            });
          }
        }
      } else {
        //TODO 중복안되면 그룹내 합계 처리
      }
    }

    const firstRowName = rowGroup[0].name.startsWith('Group') ? '구분' : rowGroup[0].name;

    columns.unshift({
      key: 'division',
      title: firstRowName,
    });

    if (showColsTotal) {
      columns.push({ title: '총계', key: 'total' });
      fields.push('total');
    }

    // console.log({ fieldValuesMap });

    const { groupValues, lineItemCodesMap } = getGroupValuesAndCodes(lineItems, rowGroup[0].groupId);

    // console.log({ groupValues, lineItemCodesMap });

    const rows: GridRowData[] = Array.from({ length: groupValues.length }, (_, i) => {
      const mapKey = groupValues[i] as unknown as KeyTypeFromItemValue;
      const codes = lineItemCodesMap[mapKey];
      const row: GridRowData = { division: groupValues[i] };

      for (const field of fields) {
        const fieldValue = fieldValuesMap[field]?.find((v) => codes.includes(v.code));
        if (typeof field === 'string' && fieldValue) {
          row[field] = fieldValue.value;
        } else if (field === 'total') {
          const totalKey = groupValues[i] as unknown as KeyTypeFromItemValue;
          row[field] = (groupedRowData[totalKey] as ILineItem[]).reduce(
            (sum, item) => sum + Number(item.value ?? 0),
            0,
          );
        } else if (field.includes('subtotal')) {
          for (const subtotal in subtotals) {
            const key = field.split('_')[0];
            if (key === subtotal) {
              row[field] = (subtotals[subtotal] as Subtotal[])[i].subtotal;
            }
          }
        }
      }

      return row;
    });

    if (showRowsTotal) {
      const row: GridRowData = { division: '총계' };
      for (const field of fields) {
        const items = fieldValuesMap[field];
        if (items) {
          const sum = fieldValuesMap[field].reduce((sum, item) => sum + Number(item.value ?? 0), 0);
          row[field] = sum;
        } else if (field.includes('subtotal')) {
          for (const subtotal in subtotals) {
            const key = field.split('_')[0];
            if (key === subtotal) {
              row[field] = (subtotals[subtotal] as Subtotal[]).reduce((sum, v) => sum + v.subtotal, 0);
            }
          }
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

  const extractRowsWithIndent = ({
    groupedData,
    indentLevel = 0,
    result = [],
    valueColumns,
  }: {
    groupedData: GroupedData | ILineItem[];
    indentLevel?: number;
    result?: GridRowData[];
    valueColumns: GridColumn[];
  }): GridRowData[] => {
    if (Array.isArray(groupedData)) return result;

    const indent = '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'.repeat(indentLevel);

    for (const field in groupedData) {
      const division = `${indent}${field}`;

      const row: GridRowData = { division };
      if (Array.isArray(groupedData[field]) && groupedData[field].length) {
        for (const col of valueColumns) {
          const value = (groupedData[field] as ILineItem[]).reduce(
            (sum, cur) => sum + (isNaN(Number(cur[col.key])) ? 0 : Number(cur[col.key])),
            0,
          );
          row[col.key] = value;
        }
      }

      result.push(row);

      if (typeof groupedData[field] === 'object' && groupedData[field] !== null && !Array.isArray(groupedData[field])) {
        extractRowsWithIndent({
          groupedData: groupedData[field],
          indentLevel: indentLevel + 1,
          result,
          valueColumns,
        });
      }
    }

    return result;
  };

  //주어진 그룹의 유니크한 값과 그 값에 해당하는 아이템 코드 구하기
  const getGroupValuesAndCodes = (lineItems: ILineItem[], groupId: string) => {
    const groupValues: ItemValueType[] = [];
    const lineItemCodesMap: Record<string, ItemValueType[]> = {};

    for (const item of lineItems) {
      const itemValue = item[groupId] as unknown as KeyTypeFromItemValue;

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
        const groupKey = item[currentKey] as unknown as KeyTypeFromItemValue;
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
    const columnDefs: GridColumn[] = [];
    const fieldValuesMap: Record<string, ILineItem[]> = {};
    let total = 0;

    const traverse = (data: GroupedData | ILineItem[], parentName: string | null): GridColumn[] => {
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
        const columnDef = children.length
          ? {
              title: `${key.charAt(0).toUpperCase()}${key.slice(1)}`,
              key,
              children: children as GridColumn[],
            }
          : {
              title: `${key.charAt(0).toUpperCase()}${key.slice(1)}`,
              key: childName,
            };
        return columnDef;
      });
    };

    columnDefs.push(...traverse(groupedData, null));

    return { columns: columnDefs, fieldValuesMap, total };
  };

  const calculateColGroupSubtotals = (data: GroupedData): Subtotals => {
    const result: { [key: string]: { [name: string]: number } } = {};

    const addValue = (map: { [name: string]: number }, index: number, value: number) => {
      if (!map[index]) {
        map[index] = 0;
      }
      map[index] += value;
    };

    for (const purpose in data) {
      const purposeData = data[purpose];

      if (typeof purposeData !== 'object' || Array.isArray(purposeData)) {
        continue;
      }

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

  // 함수를 정의하여 하위 그룹의 키 중복 여부 확인
  const checkSubgroupKeys = (groupedData: GroupedData): boolean => {
    const keysSet: Set<string> = new Set();

    function traverse(data: GroupedData | ILineItem[]): boolean {
      if (Array.isArray(data)) {
        // 배열은 중복 검사의 대상이 아니므로 false 반환
        return false;
      } else {
        let hasDuplicateKeys = false;

        for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            if (keysSet.has(key)) {
              hasDuplicateKeys = true;
              break;
            }
            keysSet.add(key);

            const value = data[key];
            // 배열이 아닌 경우에만 재귀적으로 탐색
            if (typeof value === 'object' && !Array.isArray(value)) {
              hasDuplicateKeys = traverse(value);
            }

            if (hasDuplicateKeys) {
              break;
            }
          }
        }

        return hasDuplicateKeys;
      }
    }

    return traverse(groupedData);
  };

  return { getBasicGridData, getPivotGridData, getOnlyRowGroupGridData, calculateColGroupSubtotals };
};
