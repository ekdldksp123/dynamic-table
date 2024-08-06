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
import { areStringArraysEqual, groupByHierarchical } from '../utils';
import { useCallback } from 'react';
import { IGetBasicGridData, IGetOnlyRowGroupGridData, IGetPivotGridData } from '@/types/create-table';

type GridColumnsData = {
  columns: GridColumn[];
  fieldValuesMap: Record<string, ILineItem[]>;
  total: number;
};

export const useCreateTable = () => {
  const extractRowsWithIndent = useCallback(
    ({
      groupedData,
      indentLevel = 0,
      result = [],
      valueColumns,
      showBaseTotal,
    }: {
      groupedData: GroupedData | ILineItem[];
      indentLevel?: number;
      result?: GridRowData[];
      valueColumns: GridColumn[];
      showBaseTotal: CheckedState;
    }): GridRowData[] => {
      if (Array.isArray(groupedData)) return result;

      const indent = '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'.repeat(indentLevel);

      const subtotal: Record<string, number> = {};
      for (const field in groupedData) {
        const division = `${indent}${field}`;

        const row: GridRowData = { division };
        if (Array.isArray(groupedData[field]) && groupedData[field].length) {
          let colsTotal = 0;
          for (const col of valueColumns) {
            let baseTotal = 0;
            if (col.children && col.children.length) {
              for (const child of col.children) {
                const key = child.key;
                const value = (groupedData[field] as ILineItem[]).reduce(
                  (sum, cur) => sum + (isNaN(Number(cur[key])) ? 0 : Number(cur[key])),
                  0,
                );

                if (value !== 0) {
                  colsTotal += value;

                  row[key] = value;
                  if (showBaseTotal) {
                    baseTotal += value;
                  }
                } else if (showBaseTotal) {
                  row[key] = baseTotal;
                }

                if (subtotal[key] === undefined) {
                  subtotal[key] = value;
                } else {
                  subtotal[key] += value;
                }
              }
            } else {
              const key = col.key;
              if (key === 'total') {
                //TODO
                row[key] = colsTotal;
              } else {
                const value = (groupedData[field] as ILineItem[]).reduce(
                  (sum, cur) => sum + (isNaN(Number(cur[key])) ? 0 : Number(cur[key])),
                  0,
                );
                colsTotal += value;
                row[key] = value;
                if (subtotal[key] === undefined) {
                  subtotal[key] = value;
                } else {
                  subtotal[key] += value;
                }
              }
            }
          }
        }

        result.push(row);

        if (
          typeof groupedData[field] === 'object' &&
          groupedData[field] !== null &&
          !Array.isArray(groupedData[field])
        ) {
          extractRowsWithIndent({
            groupedData: groupedData[field],
            indentLevel: indentLevel + 1,
            result,
            valueColumns,
            showBaseTotal,
          });
        }
      }

      const subtotalRow: GridRowData = {
        division: `${indent}${indentLevel === 0 ? '총계' : '합계'}`,
        show: false,
        depth: indentLevel,
      };
      const subtotalEntries = Object.entries(subtotal);

      if (subtotalEntries.length) {
        Object.entries(subtotal).forEach(([key, value]) => {
          subtotalRow[key] = value;
        });
        result.push(subtotalRow);
      }

      return result;
    },
    [],
  );

  const getOnlyRowGroupGridData = useCallback(
    ({ headers, rowGroup, lineItems, lineItemGroups, showRowsTotal, showBaseTotal }: IGetOnlyRowGroupGridData) => {
      const firstRowName = rowGroup[0].name.startsWith('Group') ? '구분' : rowGroup[0].name;
      const columns: GridColumn[] = [
        {
          title: firstRowName,
          key: 'division',
        },
      ];

      const valueColumns: GridColumn[] = [];

      const firstItem = lineItems[0];
      if (firstItem.base.length >= 2 && firstItem.value === undefined) {
        const baseColumnGroups: GridColumn[] = lineItems[0].base.map((base) => {
          return {
            key: base,
            title: base,
            children: [],
          };
        });

        for (const header of headers) {
          const headerArr = header.split('_');
          const column = headerArr[0];
          const group = headerArr[1];
          const findGroupIndex = baseColumnGroups.findIndex((g) => g.key === group);

          if (findGroupIndex > -1) {
            baseColumnGroups[findGroupIndex].children?.push({
              title: column,
              key: header,
            });
          }
        }

        if (showBaseTotal) {
          for (const baseColumnGroup of baseColumnGroups) {
            if (baseColumnGroup.children) {
              baseColumnGroup.children.push({
                key: `${baseColumnGroup.key}_total`,
                title: '합계',
              });
            }
          }
        }

        valueColumns.push(...baseColumnGroups);
        columns.push(...baseColumnGroups);
      } else {
        const additionalColumns: GridColumn[] = [
          ...headers,
          ...lineItemGroups.filter((group) => !rowGroup.find((rowG) => rowG.groupId === group.groupId)),
        ].map((col: string | ILineItemGroup) => {
          const isColString = typeof col === 'string';
          const key = isColString ? col.toLowerCase() : col.groupId;
          const header = isColString ? (key !== 'value' ? col : lineItems[0].base[0]) : col.name;

          return {
            title: header,
            key: key,
          };
        });

        valueColumns.push(...additionalColumns);
        columns.push(...valueColumns);
      }

      const groupedRowData: GroupedData = groupByHierarchical(
        lineItems,
        rowGroup.map(({ groupId }) => groupId),
      );

      const rows: GridRowData[] = extractRowsWithIndent({ groupedData: groupedRowData, valueColumns, showBaseTotal });

      // console.log({ rows });

      if (showRowsTotal) {
        for (const row of rows) {
          if (row.division === '총계') {
            // console.log({ showRowsTotal, row });
            row.show = true;

            for (const { children } of valueColumns) {
              if (children && children.length) {
                let total = 0;
                children.forEach((col, index, arr) => {
                  const key = col.key;

                  if (index < arr.length - 1) {
                    const value = Number(row[key]);
                    total += isNaN(value) ? 0 : value;
                  } else {
                    row[key] = total;
                  }
                });
              } else {
                //TODO
              }
            }
          }
        }
        const findRowsTotal = rows.find((row) => row.division === '총계');
        if (!findRowsTotal) {
          const subtotals = rows.filter((row) => row.division?.toString().trim() === '합계');
          const rowsTotal = subtotals.reduce(
            (acc, cur) => {
              for (const key in cur) {
                // 문자열 값을 제외한 키만 합산합니다.
                const value = cur[key];
                if (typeof value === 'number') {
                  acc[key] = Number(acc[key] || 0) + value;
                }
              }
              return acc;
            },
            { division: '총계' },
          );
          rows.push(rowsTotal);
        }
      }

      const showSubtotalGroups = rowGroup.filter((group) => group.showTotal === true);
      for (const group of showSubtotalGroups) {
        for (const row of rows) {
          if (row.depth === group.level && row.show !== undefined && row.show === false) {
            row.show = true;
          }
        }
      }

      return {
        columns,
        rows,
      };
    },
    [extractRowsWithIndent],
  );

  const getBasicGridData = useCallback(({ headers, lineItems, lineItemGroups }: IGetBasicGridData) => {
    //lineItems 그대로 뿌려준다

    const firstItem = lineItems[0];
    if (firstItem.base.length >= 2 && firstItem.value === undefined) {
      const columns: GridColumn[] = lineItems[0].base.map((base) => {
        return {
          key: base,
          title: base,
          children: [],
        };
      });

      columns.push(
        ...lineItemGroups.map((col: ILineItemGroup) => {
          const key = col.groupId;
          const title = col.name;

          return {
            title,
            key,
          };
        }),
      );

      for (const header of headers) {
        const headerArr = header.split('_');
        const column = headerArr[0];
        const group = headerArr[1];
        const findGroupIndex = columns.findIndex((g) => g.key === group);

        if (findGroupIndex > -1) {
          columns[findGroupIndex].children?.push({
            title: column,
            key: header,
          });
        }
      }

      const rows = [];

      for (const item of lineItems) {
        const data: Record<string, ItemValueType> = {};
        for (const col of columns) {
          if (col.children && col.children.length) {
            for (const child of col.children) {
              const key = child.key;
              data[key] = item[key];
            }
          }

          const key = col.key;
          if (item[key]) {
            data[key] = item[key];
          }
        }
        rows.push(data);
      }
      return {
        columns,
        rows,
      };
    } else {
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
      return {
        columns,
        rows,
      };
    }
  }, []);

  const getPivotGridData = useCallback(
    ({ lineItems, colGroup, rowGroup, showColsTotal, showRowsTotal, showBaseTotal }: IGetPivotGridData) => {
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

      const groupedColumnsKeys = Object.keys(groupedColumnData);

      if (colGroup.length === 1 && groupedColumnsKeys.length === 1) {
        const columns: GridColumn[] = [{ title: groupedColumnsKeys[0], key: 'value' }];

        if (lineItems[0].customFields?.length) {
          columns.unshift(
            ...lineItems[0].customFields.map((customField) => {
              return {
                key: customField,
                title: customField,
              } as GridColumn;
            }),
          );
        }

        const valueColumns = [...columns];

        const firstColName = rowGroup[rowGroup.length - 1].name.startsWith('Group')
          ? '구분'
          : rowGroup[rowGroup.length - 1].name;

        columns.unshift({
          key: 'division',
          title: firstColName,
        });

        if (showColsTotal) {
          const colsTotal = { title: '총계', key: 'total' };
          columns.push(colsTotal);
          valueColumns.push(colsTotal);
        }

        const rows: GridRowData[] = extractRowsWithIndent({ groupedData: groupedRowData, valueColumns, showBaseTotal });

        if (showRowsTotal) {
          for (const row of rows) {
            if (row.division === '총계') {
              // console.log({ showRowsTotal, row });
              row.show = true;

              for (const { children } of valueColumns) {
                if (children && children.length) {
                  let total = 0;
                  children.forEach((col, index, arr) => {
                    const key = col.key;

                    if (index < arr.length - 1) {
                      const value = Number(row[key]);
                      total += isNaN(value) ? 0 : value;
                    } else {
                      row[key] = total;
                    }
                  });
                } else {
                  //TODO
                }
              }
            }
          }
          const findRowsTotal = rows.find((row) => row.division === '총계');
          if (!findRowsTotal) {
            const subtotals = rows.filter((row) => row.division?.toString().trim() === '합계');
            const rowsTotal = subtotals.reduce(
              (acc, cur) => {
                for (const key in cur) {
                  // 문자열 값을 제외한 키만 합산합니다.
                  const value = cur[key];
                  if (typeof value === 'number') {
                    acc[key] = Number(acc[key] || 0) + value;
                  }
                }
                return acc;
              },
              { division: '총계' },
            );
            rows.push(rowsTotal);
          }
        }

        const showSubtotalGroups = rowGroup.filter((group) => group.showTotal === true);
        for (const group of showSubtotalGroups) {
          for (const row of rows) {
            if (row.depth === group.level && row.show !== undefined && row.show === false) {
              row.show = true;
            }
          }
        }

        return { columns, rows };
      } else if (rowGroup.length === 1) {
        const { columns, fieldValuesMap, total } = transformToGridColumnsData(groupedColumnData);
        const fields = Object.keys(fieldValuesMap);

        if (lineItems[0].customFields?.length) {
          columns.unshift(
            ...lineItems[0].customFields.map((customField) => {
              return {
                key: customField,
                title: customField,
              } as GridColumn;
            }),
          );
        }

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
      } else {
        //TODO
        return {
          columns: [],
          rows: [],
        };
      }
    },
    [extractRowsWithIndent],
  );

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
