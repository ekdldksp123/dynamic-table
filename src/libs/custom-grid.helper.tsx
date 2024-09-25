import { GridColumn } from '@/types';
import { GridData, ILineItem, ILineItemGroup } from '@/types/create-table.v2';
import { group } from 'console';

export const getColSpan = (column: GridColumn): number => {
  if (!column.children) return 1;
  return column.children.reduce((span, child) => span + getColSpan(child), 0);
};

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
