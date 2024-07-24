import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { ComponentProps, FC } from 'react';
ModuleRegistry.registerModules([ClientSideRowModelModule]);

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';

export type GridProps = ComponentProps<typeof AgGridReact>;

export const INTIAL_GRID_OPTIONS: GridProps = {
  defaultColDef: {
    flex: 1, // 각 컬럼이 동일한 비율로 너비를 차지하게 합니다.
    resizable: true, // 컬럼의 크기 조절을 가능하게 합니다.
  },
  columnDefs: [],
  rowData: [],
  onGridReady: () => {},
  grandTotalRow: undefined,
};

export const Grid: FC<GridProps> = ({ ...props }) => {
  return (
    <div className='w-[100%] h-[500px]'>
      <div className='ag-theme-quartz w-[100%] h-[100%]'>
        <AgGridReact {...props} />
      </div>
    </div>
  );
};
