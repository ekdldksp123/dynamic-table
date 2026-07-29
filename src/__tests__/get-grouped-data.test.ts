import {
  getGroupedData,
  getLeafColumnItemsMap,
  groupByHierarchical,
  transformToGridGroup,
} from '@/libs/custom-grid.helper';
import { GridGroup, ILineItem, ILineItemGroup } from '@/types/create-table.v2';

const PURPOSE = 'purpose';
const SIDE = 'side';
const VALUE = 'value';

const item = (code: string, purpose: string, side: string, value: number): ILineItem => ({
  code,
  base: '당기말',
  [PURPOSE]: purpose,
  [SIDE]: side,
  value,
});

//        자산   부채
// 매매      1      2
// 위험회피   3     43
const lineItems: ILineItem[] = [
  item('112130700', '매매목적', '자산', 1),
  item('205170700', '매매목적', '부채', 2),
  item('112132000', '위험회피목적', '자산', 3),
  item('205172000', '위험회피목적', '부채', 43),
];

const group = (id: string, name: string, index: number, showTotal = false): ILineItemGroup => ({
  id,
  name,
  index,
  showTotal,
});

/** `getPivotGridData` 가 하는 조립 과정을 그대로 따라간다. */
const pivot = ({ showRowsTotal = false, showColsTotal = false } = {}) => {
  const { gridGroups: rows } = transformToGridGroup({
    groupedData: groupByHierarchical(lineItems, [PURPOSE]),
    groups: [group(PURPOSE, '거래목적', 0)],
    showTotal: showRowsTotal,
    lineItems,
  });

  const { gridGroups: columns } = transformToGridGroup({
    groupedData: groupByHierarchical(lineItems, [SIDE]),
    groups: [group(SIDE, '자산부채', 0)],
    showTotal: showColsTotal,
    lineItems,
    axis: 'col',
    values: [VALUE],
  });

  const columnsKeyValueMap = getLeafColumnItemsMap(columns);
  return getGroupedData({ rows, columns: columnsKeyValueMap, values: [VALUE] });
};

describe('getGroupedData — 행 × 열 교차', () => {
  test('각 행은 그 행에 속한 항목만으로 열 값을 집계한다', () => {
    expect(pivot()).toEqual([
      { division: '매매목적', 자산_value: 1, 부채_value: 2 },
      { division: '위험회피목적', 자산_value: 3, 부채_value: 43 },
    ]);
  });

  test('총계 행은 모든 항목을 받으므로 열 전체 합이 된다', () => {
    const data = pivot({ showRowsTotal: true });
    expect(data[data.length - 1]).toEqual({ division: 'row_total', 자산_value: 4, 부채_value: 45 });
  });

  test('열이 없으면 값 그룹별로 행 합계만 낸다', () => {
    const { gridGroups: rows } = transformToGridGroup({
      groupedData: groupByHierarchical(lineItems, [PURPOSE]),
      groups: [group(PURPOSE, '거래목적', 0)],
      showTotal: false,
      lineItems,
    });

    expect(getGroupedData({ rows, columns: {}, values: [VALUE] })).toEqual([
      { division: '매매목적', value: 3 },
      { division: '위험회피목적', value: 46 },
    ]);
  });

  test('행 트리가 중첩되면 잎 행만 데이터가 된다', () => {
    const { gridGroups: rows } = transformToGridGroup({
      groupedData: groupByHierarchical(lineItems, [PURPOSE, SIDE]),
      groups: [group(PURPOSE, '거래목적', 0), group(SIDE, '자산부채', 1)],
      showTotal: false,
      lineItems,
    });

    expect(getGroupedData({ rows, columns: {}, values: [VALUE] })).toEqual([
      { division: '매매목적_자산', value: 1 },
      { division: '매매목적_부채', value: 2 },
      { division: '위험회피목적_자산', value: 3 },
      { division: '위험회피목적_부채', value: 43 },
    ]);
  });

  test('행에 없는 항목만 든 열은 0이다', () => {
    const rows: GridGroup[] = [{ key: '매매목적', title: '매매목적', items: [lineItems[0]] }];
    const columns = { onlyOther: [lineItems[3]] };

    expect(getGroupedData({ rows, columns, values: [VALUE] })).toEqual([{ division: '매매목적', onlyOther: 0 }]);
  });
});
