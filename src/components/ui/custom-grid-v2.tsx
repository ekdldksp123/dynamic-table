import { amountToLocaleString, getColSpan, getMaxDepth, getRowSpan } from '@/libs/custom-grid.helper';
import { GridData, GridGroup } from '@/types/create-table.v2';
import classNames from 'classnames';
import { FC, ReactNode, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface GridProps {
  columns: GridGroup[];
  rows: GridGroup[];
  data: GridData[];
}

export const Grid: FC<GridProps> = ({ columns, rows, data }) => {
  const colMaxDepth = useMemo(() => getMaxDepth(columns), [columns]);
  const rowMaxDepth = useMemo(() => getMaxDepth(rows), [rows]);

  const dataKeys = useMemo(() => (data.length ? Object.keys(data[0]).filter((key) => key !== 'division') : []), [data]);

  const renderData = useCallback(
    (row: GridGroup) => {
      const dataDivision = row.key;
      const findData = data.find(({ division }) => division === dataDivision);

      return findData
        ? dataKeys.map((key) => {
            const value = findData[key];
            const isNumber = typeof value === 'number';

            return (
              <td
                key={uuidv4()}
                className={classNames(
                  'px-4 py-2 bg-[#EDF0FE] font-normal border-r border-b border-white',
                  { '!text-right': isNumber },
                  { '!bg-[#C1C4CF]': dataDivision.includes('subtotal') || dataDivision.includes('total') },
                )}
              >
                {isNumber ? amountToLocaleString(value) : value}
              </td>
            );
          })
        : [];
    },
    [data, dataKeys],
  );

  const renderFirstChild = useCallback(
    (row: GridGroup | null): JSX.Element[] => {
      if (!row) return [];

      const rowSpan = getRowSpan(row);
      const children = row.children ?? [];
      const hasChildren = children.length > 0;

      const firstChild = hasChildren ? children[0] : null;

      return [
        <td
          key={row.key}
          rowSpan={rowSpan}
          colSpan={1}
          className={classNames('px-4 py-2 bg-[#DCE2F7] font-semibold border-r border-b border-white', {
            '!bg-[#C1C4CF]': row.key.includes('subtotal'),
          })}
        >
          {row.title}
        </td>,
        ...renderFirstChild(firstChild),
        ...renderData(row),
      ];
    },
    [renderData],
  );

  const renderRow = useCallback(
    (row: GridGroup, depth: number): JSX.Element[] => {
      const rowSpan = getRowSpan(row);
      const colSpan = row.title === '합계' ? rowMaxDepth - depth - 1 : row.title === '총계' ? rowMaxDepth - depth : 1;
      const children = row.children ?? [];
      const hasChildren = children.length > 0;

      const firstChild = hasChildren ? children[0] : null;
      const firstChildsChildren = firstChild?.children?.length ? [...firstChild.children] : [];

      return [
        <tr key={row.key}>
          <td
            colSpan={colSpan}
            rowSpan={rowSpan}
            className={classNames('px-4 py-2 bg-[#DCE2F7] font-semibold border-r border-b border-white', {
              '!bg-[#C1C4CF]':
                row.title === '합계' || row.title === '총계' || row.title === '소계' || row.key.includes('subtotal'),
            })}
          >
            {row.title}
          </td>
          {[...renderFirstChild(firstChild), ...renderData(row)]}
        </tr>,
        ...firstChildsChildren.slice(1).flatMap((child) => renderRow(child, depth + 1)),
        ...children.slice(1).flatMap((child) => renderRow(child, depth + 1)),
      ];
    },
    [rowMaxDepth, renderFirstChild, renderData],
  );

  const renderRows = useCallback(() => {
    if (rows.length) {
      return rows.flatMap((row) => renderRow(row, 0));
    }

    return data.map((row) => {
      const values = Object.values(row);
      return (
        <tr key={uuidv4()}>
          {values.map((v) => {
            const isNumber = typeof v === 'number';

            return (
              <td
                key={uuidv4()}
                className={classNames('px-4 py-2 bg-[#EDF0FE] font-normal border-r border-b border-white', {
                  '!text-right': isNumber,
                })}
              >
                {isNumber ? amountToLocaleString(v) : v}
              </td>
            );
          })}
        </tr>
      );
    });
  }, [rows, renderRow, data]);

  const renderHeaders = useCallback(() => {
    const headerRows: ReactNode[][] = [];

    const isAllGrouped = !!columns.find((col) => !col.children);
    const renderHeader = (cols: GridGroup[], depth: number) => {
      if (!headerRows[depth]) {
        headerRows[depth] = [];
      }

      headerRows[depth] = headerRows[depth].concat(
        cols.map((col, idx) => (
          <th
            key={col.key}
            colSpan={getColSpan(col, idx, rowMaxDepth)}
            rowSpan={
              depth === 0 && idx === 0
                ? colMaxDepth
                : !col.children
                  ? isAllGrouped
                    ? colMaxDepth - 1
                    : colMaxDepth - depth
                  : 1
            }
            className={classNames('px-4 py-2 border-r border-b border-white grow', {
              'bg-[#B0BDEA]': depth !== 0,
            })}
          >
            {col.title}
          </th>
        )),
      );

      for (const col of cols) {
        if (col.children) {
          renderHeader(col.children, depth + 1);
        }
      }
    };
    renderHeader(columns, 0);
    return headerRows.map((row) => <tr key={uuidv4()}>{row}</tr>);
  }, [columns, colMaxDepth, rowMaxDepth]);

  return (
    <div className='max-w-[100%] overflow-x-auto'>
      <table className='relative min-w-full bg-white whitespace-nowrap'>
        <thead className='w-[100%] bg-[#DCE2F7] font-semibold border-b border-white sticky top-0'>
          {renderHeaders()}
        </thead>
        <tbody>{renderRows()}</tbody>
      </table>
    </div>
  );
};
