import { GridRowData } from '@/types';
import { FC, useState } from 'react';
import {
  GroupingState,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getCoreRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';

interface DataGridProps {
  columns: ColumnDef<GridRowData, unknown>[];
  data: GridRowData[];
}

export const DataGrid: FC<DataGridProps> = ({ data, columns }) => {
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: {
      grouping,
    },
    onGroupingChange: setGrouping,
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // debugTable: true,
  });

  return (
    <table className='w-[100%]'>
      <thead className='w-[100%] bg-[#DCE2F7] border-b font-medium border-white'>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              //TODO header rowSpan...
              //   const rowSpan = header.column.columnDef.meta?.rowSpan;

              //   if (header.id === 'division' && header.depth !== 1) {
              //     return null;
              //   }

              //   if (!header.isPlaceholder && rowSpan !== undefined && header.id === header.column.id) {
              //     return null;
              //   }
              return (
                <th
                  className='px-4 py-2 border-r border-b font-medium border-white'
                  key={header.id}
                  colSpan={header.colSpan}
                  //   rowSpan={rowSpan}
                >
                  {header.isPlaceholder ? null : (
                    <div>
                      {header.column.getCanGroup() ? (
                        // If the header can be grouped, let's add a toggle
                        <button
                          {...{
                            onClick: header.column.getToggleGroupingHandler(),
                            style: {
                              cursor: 'pointer',
                            },
                          }}
                        >
                          {header.column.getIsGrouped() ? `🛑(${header.column.getGroupedIndex()}) ` : ``}
                        </button>
                      ) : null}{' '}
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => {
          return (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => {
                return (
                  <td
                    key={cell.id}
                    className='px-4 py-2 !bg-[#EDF0FE] border-r border-b font-normal border-white text-center'
                    {...{
                      style: {
                        background: cell.getIsGrouped()
                          ? '#0aff0082'
                          : cell.getIsAggregated()
                            ? '#ffa50078'
                            : cell.getIsPlaceholder()
                              ? '#ff000042'
                              : 'white',
                      },
                    }}
                  >
                    {cell.getIsGrouped() ? (
                      // If it's a grouped cell, add an expander and row count
                      <>
                        <button
                          {...{
                            onClick: row.getToggleExpandedHandler(),
                            style: {
                              cursor: row.getCanExpand() ? 'pointer' : 'normal',
                            },
                          }}
                        >
                          {row.getIsExpanded() ? '👇' : '👉'}{' '}
                          {flexRender(cell.column.columnDef.cell, cell.getContext())} ({row.subRows.length})
                        </button>
                      </>
                    ) : cell.getIsAggregated() ? (
                      // If the cell is aggregated, use the Aggregated
                      // renderer for cell
                      flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext())
                    ) : cell.getIsPlaceholder() ? null : ( // For cells with repeated values, render null
                      // Otherwise, just render the regular cell
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
