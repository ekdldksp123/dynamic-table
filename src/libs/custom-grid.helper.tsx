import { GridColumn } from '@/types';

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
