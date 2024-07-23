/* eslint-disable @typescript-eslint/no-unused-vars */
import { GridColumnDef, GroupedData, ILineItem, ILineItemGroup, ItemValueType } from '@/types';

interface IGetPivotGridData {
  lineItems: ILineItem[];
  colGroup: ILineItemGroup[];
  rowGroup: ILineItemGroup[];
}
export const useCreateTable = () => {
  const getPivotGridData = ({ lineItems, colGroup, rowGroup }: IGetPivotGridData) => {
    // console.log({ colGroup, rowGroup });
    // 행과 열 그룹별로 컬럼과 행을 구성

    const groupedData: GroupedData = groupByHierarchical(
      lineItems,
      colGroup.map((group) => group.groupId),
    );
    // console.log({ groupedData });

    const { columns, fields, fieldValuesMap } = transformToGridData(groupedData);
    const firstRowName = rowGroup[0].name.startsWith('Group') ? '구분' : rowGroup[0].name;
    columns.unshift({ field: firstRowName });

    const { groupValues, lineItemCodesMap } = getGroupValuesAndCodes(lineItems, rowGroup[0].groupId);
    const rows = Array.from({ length: groupValues.length }, (_, i) => {
      const mapKey = groupValues[i] as unknown as Exclude<ItemValueType, boolean | null | string[]>;
      const codes = lineItemCodesMap[mapKey];
      const row = { [firstRowName]: groupValues[i] };

      for (const field of fields) {
        const fieldValue = fieldValuesMap[field].find((v) => codes.includes(v.code));
        if (fieldValue) {
          row[field] = fieldValue.value;
        }
      }
      return row;
    });

    // console.log({ columns, rows });
    return {
      columns,
      rows,
    };
  };

  //주어진 그룹의 유니크한 값과 그 값에 해당하는 아이템 코드 구하기
  const getGroupValuesAndCodes = (lineItems: ILineItem[], groupId: string) => {
    const groupValues: ItemValueType[] = [];
    const lineItemCodesMap: Record<string, ItemValueType[]> = {};

    for (const item of lineItems) {
      const itemValue = item[groupId] as unknown as Exclude<ItemValueType, boolean | null | string[]>;

      if (!groupValues.includes(itemValue)) {
        groupValues.push(itemValue);
        lineItemCodesMap[itemValue] = [item.code];
      } else {
        lineItemCodesMap[itemValue] = [...lineItemCodesMap[itemValue], item.code];
      }
    }
    return { groupValues, lineItemCodesMap };
  };

  // 계층 구조 그루핑하기
  const groupByHierarchical = (data: ILineItem[], keys: (keyof ILineItem)[]): GroupedData => {
    const groupByRecursively = (items: ILineItem[], remainingKeys: (keyof ILineItem)[]): GroupedData | ILineItem[] => {
      if (remainingKeys.length === 0) {
        return items;
      }
      const [currentKey, ...nextKeys] = remainingKeys;
      return items.reduce((result, item) => {
        const groupKey = item[currentKey] as unknown as Exclude<ItemValueType, boolean | null | string[]>;
        if (!result[groupKey]) {
          result[groupKey] = [];
        }
        (result[groupKey] as ILineItem[]).push(item);
        return result;
      }, {} as GroupedData);
    };

    const nestedGroupBy = (groupedData: GroupedData, keys: (keyof ILineItem)[]): GroupedData => {
      if (keys.length === 0) return groupedData;
      const [currentKey, ...nextKeys] = keys;
      for (const key in groupedData) {
        if (Array.isArray(groupedData[key])) {
          groupedData[key] = groupByRecursively(groupedData[key] as ILineItem[], [currentKey]);
          nestedGroupBy(groupedData[key] as GroupedData, nextKeys);
        }
      }
      return groupedData;
    };

    const initialGroup = groupByRecursively(data, [keys[0]]);
    return nestedGroupBy(initialGroup as GroupedData, keys.slice(1));
  };

  // 그룹핑된 데이터로 테이블 컬럼, 값 필드, 그룹에 해당하는 값 배열 추출하기
  const transformToGridData = (
    groupedData: GroupedData,
  ): { columns: GridColumnDef[]; fields: string[]; fieldValuesMap: Record<string, ILineItem[]> } => {
    const columnDefs: GridColumnDef[] = [];
    const fields: string[] = [];
    const fieldValuesMap: Record<string, ILineItem[]> = {};

    const traverse = (data: GroupedData | ILineItem[], parentName: string | null): GridColumnDef[] => {
      if (Array.isArray(data)) {
        if (parentName) fieldValuesMap[parentName] = [...data];
        return [];
      }

      return Object.keys(data).map((key) => {
        const childName = parentName ? `${parentName}_${key}` : key;
        const children = traverse(data[key], childName);
        const fieldName = children.length ? undefined : childName;
        const columnDef: GridColumnDef = {
          headerName: key,
          field: fieldName,
          children: children.length ? children : undefined,
        };

        if (fieldName) fields.push(fieldName);

        return columnDef;
      });
    };

    columnDefs.push(...traverse(groupedData, null));

    return { columns: columnDefs, fields, fieldValuesMap };
  };

  return { getPivotGridData };
};
