import { GridColumnDef, GroupedData, ILineItem, ILineItemGroup } from '@/types';
import { groupByHierarchical } from '../utils';

interface IGetTableData {
  lineItems: ILineItem[];
  colGroup: ILineItemGroup[];
  rowGroup: ILineItemGroup[];
}
export const useCreateTable = () => {
  const getTableData = ({ lineItems, colGroup, rowGroup }: IGetTableData) => {
    console.log({ colGroup, rowGroup });
    if (!colGroup.length && !rowGroup.length && lineItems.length) {
      //lineItems 그대로 뿌려준다
      return {
        columns: [],
        rows: [],
      };
    }

    // const groupValuesMap = getGroupValues({ lineItems, lineItemGroups: colGroup.concat(rowGroup) });

    // console.log({ groupValuesMap });

    // 피봇 테이블 x
    if (!colGroup.length && rowGroup.length && lineItems.length) {
      return {
        columns: [],
        rows: [],
      };
    }

    // 피봇 테이블 o
    if (colGroup.length && rowGroup.length && lineItems.length) {
      // 행과 열 그룹별로 컬럼과 행을 구성

      // const complexColumns: IGridComplexColumn[] = [];
      const groupedData: GroupedData = groupByHierarchical(
        lineItems,
        colGroup.map((group) => group.groupId),
      );

      const columns = transformToGridColumnDefs(groupedData);
      columns.unshift({ headerName: rowGroup[0].name.startsWith('Group') ? '구분' : rowGroup[0].name });

      // const header: IGridHeader = { height: 50 * colGroup.length, complexColumns };
      console.log({ columns });
      return {
        columns,
        rows: [],
      };
    }

    return {
      columns: [],
      rows: [],
    };
  };

  const transformToGridColumnDefs = (groupedData: GroupedData): GridColumnDef[] => {
    const columnDefs: GridColumnDef[] = [];

    const traverse = (data: GroupedData | ILineItem[], parentName: string | null): GridColumnDef[] => {
      if (Array.isArray(data)) {
        return [];
      }

      return Object.keys(data).map((key) => {
        const childName = parentName ? `${parentName}_${key}` : key;
        const children = traverse(data[key] as GroupedData, childName);
        const columnDef: GridColumnDef = {
          headerName: key,
          field: children.length ? undefined : childName,
          children: children.length ? children : undefined,
        };

        return columnDef;
      });
    };

    columnDefs.push(...traverse(groupedData, null));

    return columnDefs;
  };

  return { getTableData };
};
