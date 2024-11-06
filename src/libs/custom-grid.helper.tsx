import { GridColumn, GroupedData } from '@/types';
import {
  GridData,
  GridGroup,
  ILineItem,
  ILineItemGroup,
  KeyTypeFromItemValue,
  LineItemKey,
} from '@/types/create-table.v2';

export const getMaxDepth = (columns: GridColumn[]): number => {
  return columns.reduce((depth, column) => {
    if (column.children) {
      return Math.max(depth, getMaxDepth(column.children) + 1);
    }
    return depth;
  }, 1);
};

export const flattenColumns = (columns: GridColumn[]): GridColumn[] => {
  return columns.reduce((flatCols, column) => {
    if (column.children) {
      return flatCols.concat(flattenColumns(column.children));
    }
    return flatCols.concat(column);
  }, [] as GridColumn[]);
};

export const getGroupsFromLineItems = (items: ILineItem[]) => {
  if (!items.length) return [];

  const groupIdList = Object.keys(items[0]);
  const lineItemGroups: ILineItemGroup[] = [];

  const keyUniqueCounts: { key: string; count: number }[] = [];

  for (const groupId of groupIdList) {
    const uniqueValuesCount = new Set(items.map((v) => v[groupId])).size;
    keyUniqueCounts.push({ key: groupId, count: uniqueValuesCount });

    lineItemGroups.push({
      id: groupId,
      name: groupId,
      level: 0,
      showTotal: false,
    });
  }

  keyUniqueCounts.sort((a, b) => a.count - b.count);

  let level = 0;

  for (let i = 0; i < keyUniqueCounts.length; i++) {
    const { key, count } = keyUniqueCounts[i];
    const findIndex = lineItemGroups.findIndex(({ id }) => id === key);
    if (findIndex > -1) {
      lineItemGroups[findIndex].level = level;

      if (i < keyUniqueCounts.length - 1) {
        const { count: nextCount } = keyUniqueCounts[i + 1];
        if (count !== nextCount) {
          level++;
        }
      }
    }
  }
  return lineItemGroups;
};

export const getAmountWithGivenUnit = (value: number, unit: number) => {
  return value / unit;
};

export const getDataCountedInGivenUnits = (data: GridData[], unit: number) => {
  if (!data.length) return [];

  const keys = Object.keys(data[0]);
  return data.map((row) => {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'number') {
        row[key] = getAmountWithGivenUnit(value, unit);
      }
    }
    return row;
  });
};

export const getFirstColumn = (group: ILineItemGroup): GridGroup => {
  const colName = group.name.startsWith('그룹') ? '구분' : group.name;
  return { key: 'division', title: colName };
};

export const groupByHierarchical = (data: ILineItem[], keys: LineItemKey[]): GroupedData => {
  const groupByRecursively = (items: ILineItem[], remainingKeys: LineItemKey[]): GroupedData | ILineItem[] => {
    if (remainingKeys.length === 0) {
      return items;
    }
    const [currentKey] = remainingKeys;
    return items.reduce((result, item) => {
      const groupKey = item[currentKey] as unknown as KeyTypeFromItemValue;
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      (result[groupKey] as unknown as ILineItem[]).push(item);
      return result;
    }, {} as GroupedData);
  };

  const nestedGroupBy = (groupedData: GroupedData, keys: LineItemKey[]): GroupedData => {
    if (keys.length === 0) return groupedData;

    const [currentKey, ...nextKeys] = keys;
    for (const key in groupedData) {
      if (Array.isArray(groupedData[key])) {
        groupedData[key] = groupByRecursively(groupedData[key] as unknown as ILineItem[], [currentKey]);
        nestedGroupBy(groupedData[key] as GroupedData, nextKeys);
      }
    }
    return groupedData;
  };

  const initialGroup = groupByRecursively(data, [keys[0]]);
  return nestedGroupBy(initialGroup as GroupedData, keys.slice(1));
};

export const getGroupValuesAndCodes = (items: ILineItem[], groupId: string) => {
  const groupValues: string[] = [];
  const lineItemsMap: Record<string, ILineItem[]> = {};

  for (const item of items) {
    const itemValue = item[groupId] as unknown as KeyTypeFromItemValue;

    if (!groupValues.includes(itemValue)) {
      groupValues.push(itemValue);
      lineItemsMap[itemValue] = [item];
    } else {
      lineItemsMap[itemValue] = [...lineItemsMap[itemValue], item];
    }
  }

  return { groupValues, lineItemsMap };
};

interface ITransformToGridGroup {
  groupedData: GroupedData;
  groups: ILineItemGroup[];
  showTotal: boolean;
  lineItems: ILineItem[];
  // minGroupValues: string[];
  // lineItemsMap: Record<string, ILineItem[]>;
  axis?: 'col' | 'row';
  values?: string[];
}

export const transformToGridGroup = ({
  groupedData,
  groups,
  showTotal,
  lineItems,
  axis = 'row',
  values,
}: ITransformToGridGroup): {
  gridGroups: GridGroup[];
  groupsOrderMap: Record<string, number>;
} => {
  const gridGroups: GridGroup[] = [];

  // 소계/합계/총계를 보여줘야 하는 그룹
  const showSubtotalGroups = groups.filter(({ showTotal }) => showTotal === true);

  const groupsOrderMap: Record<string, number> = {};

  const traverse = (data: GroupedData | ILineItem[], parentName: string | null, index = 0): GridGroup[] => {
    if (Array.isArray(data)) {
      if (parentName) {
        groupsOrderMap[parentName] = Math.max(...data.map((item) => item.RN as number));
      }
      return [];
    }

    return Object.keys(data)
      .filter((key) => key !== 'groupId' && key !== 'null' && key !== '')
      .map((key) => {
        const currentName = parentName ? `${parentName}_${key}` : key;

        const groupDef: GridGroup = {
          title: key,
          key: currentName,
          index,
          items: Array.isArray(data[key]) ? (data[key] as unknown as ILineItem[]) : undefined,
        };

        const children = traverse(data[key] as GroupedData | ILineItem[], currentName, index + 1);

        if (children.length) {
          children.sort((a, b) => {
            const orderMapKeys = Object.keys(groupsOrderMap);
            const aOrderList = orderMapKeys
              .filter((key) => key.includes(a.title))
              .map((k) => groupsOrderMap[k])
              .sort((x, y) => y - x);
            const bOrderList = orderMapKeys
              .filter((key) => key.includes(b.title))
              .map((k) => groupsOrderMap[k])
              .sort((x, y) => y - x);

            return aOrderList[0] - bOrderList[0];
          });

          const findSubtotalGroup = showSubtotalGroups.find(({ index: _idx }) => _idx !== undefined && _idx === index);
          if (findSubtotalGroup) {
            const subtotalGroupItems = children.flatMap((child) => child.items ?? []);

            const subtotalGroup: GridGroup = {
              index: index + 1,
              key: `${currentName}_subtotal1`,
              title: '소계',
              items: !subtotalGroupItems.length
                ? children.flatMap((child) =>
                    (child.children ?? []).flatMap((c) => (c.title === '소계' ? [] : (c.items ?? [])) as ILineItem[]),
                  )
                : subtotalGroupItems,
            };

            if (axis === 'col') {
              children.push(subtotalGroup);
            } else {
              const colSpan = getGroupedDataMaxDepth(data[key] as GroupedData | ILineItem[]);
              subtotalGroup.colSpan = !subtotalGroupItems.length ? colSpan : undefined;
              children.push(subtotalGroup);
            }
          }

          groupDef.children = children as GridGroup[];
        } else if (axis === 'col' && values?.length) {
          groupDef.items = undefined;
          groupDef.children = [];

          for (const valueKey of values) {
            const dataKey = `${currentName}_${valueKey}`;
            const items = (Array.isArray(data[key]) ? data[key] : []) as unknown as ILineItem[];

            groupDef.children.push({
              title: valueKey,
              key: dataKey,
              index,
              items,
            });
          }
        }
        return groupDef;
      });
  };

  gridGroups.push(...traverse(groupedData, null));

  if (showTotal) {
    const groupedSubtotal: GroupedData = groupByHierarchical(
      lineItems,
      groups.filter(({ index }) => index !== 0).map(({ id }) => id),
    );

    const groupedSubtotalKeys = Object.keys(groupedSubtotal);
    const total = { key: `${axis}_total`, title: '총계', itesm: lineItems };

    if (groupedSubtotalKeys.length > 1) {
      const children = traverse(groupedSubtotal, 'subtotal');

      gridGroups.push({ key: `${axis}_semi_total`, title: '합계', children });
      gridGroups.push(total);
    } else {
      gridGroups.push(total);
    }
  }

  return { gridGroups, groupsOrderMap };
};

export const checkSubgroupKeys = (groupedData: GroupedData): boolean => {
  const keySet: Set<string> = new Set();

  const traverse = (data: GroupedData | ILineItem[]): boolean => {
    if (Array.isArray(data)) {
      return false;
    }
    let hasDuplicateKeys = false;

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (keySet.has(key)) {
          hasDuplicateKeys = true;
          break;
        }
        keySet.add(key);

        const value = data[key];
        //배열이 아닌 경우에만 재귀적으로 탐색
        if (typeof value === 'object' && !Array.isArray(value)) {
          hasDuplicateKeys = traverse(value);
        }

        if (hasDuplicateKeys) {
          break;
        }
      }
    }
    return hasDuplicateKeys;
  };

  return traverse(groupedData);
};

interface IGetGroupedData {
  rows: GridGroup[];
  columns: Record<string, ILineItem[]>;
  values: string[];
  valueIsColumn?: boolean;
}

export const getGroupedData = ({ rows, columns, values, valueIsColumn = false }: IGetGroupedData) => {
  const data: GridData[] = [];
  const columnKeys = Object.keys(columns);

  const recur = ({ items, key, children }: GridGroup) => {
    if (!items && children) {
      for (const child of children) {
        recur(child);
      }
    } else {
      const row: GridData = { division: key };

      if (columnKeys.length) {
        //열이 하나고 값이 여러개인 경우 colGroup 1, valueGroup N
        if (valueIsColumn) {
          for (const colKey of columnKeys) {
            const colItems = columns[colKey];
            const valueItems = colItems.filter(({ id }) => (items ?? []).find((item) => id === item.id));
            const valueKey = colKey.split('_').pop() ?? '';

            const value = valueItems.reduce((sum, cur) => {
              const value = Number(cur[valueKey]);
              return sum + (Number.isNaN(value) ? 0 : value);
            }, 0);
            row[colKey] = value;
          }
        } else {
          let total = 0;
          for (const colKey of columnKeys) {
            const colItems = columns[colKey];
            for (const valueKey of values) {
              const valueItems = colItems.filter(({ id }) => (items ?? []).find((item) => id === item.id));
              const value = valueItems.reduce((sum, cur) => {
                const value = Number(cur[valueKey]);
                return sum + (Number.isNaN(value) ? 0 : value);
              }, 0);

              if (colKey === 'col_total') {
                row[colKey] = total;
              } else {
                row[colKey] = value;
                total += value;
              }
            }
          }
        }
      } else {
        for (const valueKey of values) {
          row[valueKey] = items?.reduce((sum, cur) => {
            const value = Number(cur[valueKey]);
            return sum + (Number.isNaN(value) ? 0 : value);
          }, 0);
        }
      }
      data.push(row);
    }
  };

  // 행을 기준으로 열 데이터 맵핑
  for (const group of rows) {
    recur(group);
  }
  return data;
};

export const amountToLocaleString = (amount: number) => {
  return amount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
};

export const getRowSpan = (row: GridGroup): number => {
  if (!row.children || !row.children.length) return 1;
  return row.children.reduce((depth, child) => depth + getRowSpan(child), 0);
};

export const getColSpan = (col: GridGroup, idx: number, depth: number, rowMaxDepth: number): number => {
  if (!col.children || !col.children.length) {
    if (idx === 0 && rowMaxDepth > 1) {
      return rowMaxDepth;
    }
    return 1;
  }
  return col.children.reduce((depth, child, index) => depth + getColSpan(child, index, depth + 1, rowMaxDepth), 0);
};

export const getGroupedDataMaxDepth = (data: GroupedData | ILineItem[], currentDepth = 0) => {
  if (Array.isArray(data)) {
    return currentDepth;
  }

  let maxDepth = currentDepth;
  for (const key in data) {
    const child = data[key];
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      maxDepth = Math.max(maxDepth, getGroupedDataMaxDepth(child, currentDepth + 1));
    }
  }

  return maxDepth;
};
