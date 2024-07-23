import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ColDef, ColGroupDef, ModuleRegistry } from '@ag-grid-community/core';
import { FC } from 'react';
ModuleRegistry.registerModules([ClientSideRowModelModule]);

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';

interface GridProps {
  columnDefs: (ColDef | ColGroupDef)[] | null;
  rowData: unknown[] | null;
  onGridReady?: () => void;
}

const defaultColDef = {
  flex: 1, // 각 컬럼이 동일한 비율로 너비를 차지하게 합니다.
  resizable: true, // 컬럼의 크기 조절을 가능하게 합니다.
};

export const Grid: FC<GridProps> = ({ columnDefs, rowData, onGridReady }) => {
  //   const onGridReady = () => {
  //     fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
  //       .then((resp) => resp.json())
  //       .then((data) => {
  //         console.log(data);
  //       });
  //   };
  return (
    <div className='w-[100%] h-[500px]'>
      <div className='ag-theme-quartz w-[100%] h-[100%]'>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
};
