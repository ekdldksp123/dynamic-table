import { GroupItemValue, IGridColumn, ILineItem, ILineItemGroup } from '@/types';

interface IGetTableData {
  lineItems: ILineItem[];
  lineItemGroups: ILineItemGroup[];
}

export const useCreateTable = () => {
  const getTableData = ({ lineItems, lineItemGroups }: IGetTableData) => {
    const colGroup = lineItemGroups.filter((group) => group.axis === 'column').sort((a, b) => a.index - b.index);
    const rowGroup = lineItemGroups.filter((group) => group.axis === 'row').sort((a, b) => a.index - b.index);

    if (!colGroup.length && !rowGroup.length && lineItems.length) {
      //lineItems 그대로 뿌려준다
      return {
        cols: [],
        rows: [],
      };
    }

    const groupValuesMap = getGroupValues({ lineItems, lineItemGroups });

    // 피봇 테이블 x
    if (!colGroup.length && rowGroup.length && lineItems.length) {
      return {
        cols: [],
        rows: [],
      };
    }

    // 피봇 테이블 o
    if (colGroup.length && rowGroup.length && lineItems.length) {
      // 행과 열 그룹별로 컬럼과 행을 구성
      const columns: IGridColumn[] = [
        { header: rowGroup[0].name.startsWith('Group') ? '구분' : rowGroup[0].name, name: 'division' },
      ];

      for (const column of colGroup) {
        groupValuesMap[column.groupId].forEach((v, i) => {
          if (v) {
            columns.push({ header: v.toString(), name: `col ${i + 1}` });
          }
        });
      }
      return {
        cols: [],
        rows: [],
      };
    }

    // // console.log({ groupValues });

    // const colGroup = reportGroups.filter((rg) => rg.axis === 'column').sort((a, b) => a.order - b.order);
    // const rowGroup = reportGroups.filter((rg) => rg.axis === 'row').sort((a, b) => a.order - b.order);

    // console.log({ colGroup, rowGroup });

    // const columns: IGridColumn[] = [{ header: '구분', name: 'group1' }];
    // const header: IGridHeader = { height: 50 * colGroup.length, complexColumns: [] };

    // if (colGroup.length > 1) {
    //   const lastColGroupId = colGroup[colGroup.length - 1].id;
    //   const lastColumns = groupValues.filter((v) => v.groupId === lastColGroupId);
    // }

    // // const complexColumns =
    // console.log({ columns });

    return {
      cols: [],
      rows: [],
    };
  };
  return { getTableData };
};

const getGroupValues = ({ lineItems, lineItemGroups }: IGetTableData) => {
  // 각 그룹별로 유니크한 값 구하기
  const groupValuesMap: Record<string, GroupItemValue[]> = {};
  for (const group of lineItemGroups) {
    const groupId = group.groupId;
    for (const item of lineItems) {
      const groupValues: GroupItemValue[] = [...groupValuesMap[groupId]];
      const itemValue = item[groupId];

      if (!groupValues.includes(itemValue)) {
        groupValues.push(itemValue);
      }
      groupValuesMap[groupId] = groupValues;
    }
  }
  return groupValuesMap;
};
