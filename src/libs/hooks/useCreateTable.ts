import { GroupedData, IGridColumn, IGridComplexColumn, IGridHeader, ILineItem, ILineItemGroup } from '@/types';
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
        data: [],
      };
    }

    // const groupValuesMap = getGroupValues({ lineItems, lineItemGroups: colGroup.concat(rowGroup) });

    // console.log({ groupValuesMap });

    // 피봇 테이블 x
    if (!colGroup.length && rowGroup.length && lineItems.length) {
      return {
        columns: [],
        data: [],
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

      const { columns, complexColumns } = transformToGridColumns(groupedData);
      columns.unshift({ header: rowGroup[0].name.startsWith('Group') ? '구분' : rowGroup[0].name, name: 'division' });

      const header: IGridHeader = { height: 50 * colGroup.length, complexColumns };
      // console.log({ columns, header });
      return {
        header,
        columns,
        data: [],
      };
    }

    return {
      columns: [],
      data: [],
    };
  };

  const transformToGridColumns = (
    groupedData: GroupedData,
  ): { columns: IGridColumn[]; complexColumns: IGridComplexColumn[] } => {
    const columns: IGridColumn[] = [];
    const complexColumns: IGridComplexColumn[] = [];

    const traverse = (data: GroupedData | ILineItem[], parentName: string | null) => {
      if (Array.isArray(data)) {
        return;
      }

      Object.keys(data).forEach((key) => {
        const childName = parentName ? `${parentName}_${key}` : key;
        columns.push({ header: key, name: childName });

        if (parentName) {
          const existingComplexColumn = complexColumns.find((col) => col.name === parentName);
          if (existingComplexColumn) {
            existingComplexColumn.childNames.push(childName);
          } else {
            complexColumns.push({ header: parentName, name: parentName, childNames: [childName] });
          }
        }

        traverse(data[key] as GroupedData, childName);
      });
    };

    traverse(groupedData, null);

    return { columns: columns.filter((v) => !complexColumns.find((c) => v.header === c.header)), complexColumns };
  };

  return { getTableData };
};
