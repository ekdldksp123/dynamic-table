import { flattenColumns, getColSpan, getMaxDepth } from '@/libs/custom-grid.helper';
import { GridColumn, GridRowData } from '@/types';
import classNames from 'classnames';
import { FC, ReactNode, useCallback, useMemo } from 'react';

interface CustomGridProps {
  columns: GridColumn[];
  rows: GridRowData[];
  numOfRowGroups: number;
}
export const CustomGrid: FC<CustomGridProps> = ({ columns, rows, numOfRowGroups }) => {
  const maxDepth = useMemo(() => getMaxDepth(columns), [columns]);

  const renderHeaders = useCallback((): React.ReactNode[] => {
    const rows: ReactNode[][] = [];
    const renderRow = (cols: GridColumn[], depth: number) => {
      if (!rows[depth]) {
        rows[depth] = [];
      }
      rows[depth] = rows[depth].concat(
        cols.map((col) => (
          <th
            key={col.key}
            colSpan={getColSpan(col)}
            rowSpan={!col.children ? maxDepth - depth : 1}
            className={classNames(
              'px-4 py-2 border-r border-b font-semibold border-white',
              depth !== 0 ? 'bg-[#B0BDEA]' : '',
            )}
          >
            {col.title}
          </th>
        )),
      );
      cols.forEach((col) => {
        if (col.children) renderRow(col.children, depth + 1);
      });
    };
    renderRow(columns, 0);
    return rows.map((row, index) => <tr key={index}>{row}</tr>);
  }, [columns, maxDepth]);

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full bg-white'>
        <thead className='w-[100%] bg-[#DCE2F7] border-b font-medium border-white'>{renderHeaders()}</thead>
        <tbody>
          {rows
            .filter((row) => row.show !== false)
            .map((row, rowIndex) => (
              <tr key={rowIndex} className='border-t'>
                {flattenColumns(columns).map((column, i) => {
                  const value = row[column.key] === 0 ? '-' : row[column.key];
                  const division = (row.division as string)?.trim();

                  return (
                    <td
                      key={column.key}
                      className={classNames(
                        'px-4 py-2 bg-[#EDF0FE] border-r border-b font-normal border-white',
                        value?.toString().trim() === '총계' || value?.toString().trim() === '합계'
                          ? '!bg-[#C1C4CF]'
                          : i === 0 && i !== columns.length - 1 && numOfRowGroups >= 1
                            ? '!bg-[#DCE2F7] font-semibold'
                            : division === '총계' || division === '합계'
                              ? '!bg-[#C1C4CF]'
                              : 'font-medium',
                      )}
                    >
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </td>
                  );
                })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
