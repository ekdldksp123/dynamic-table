import {
  getGroupedData,
  getLeafColumnItemsMap,
  groupByHierarchical,
  transformToGridGroup,
} from '@/libs/custom-grid.helper';
import { grandTotalKey, subtotalKey } from '@/libs/grid-tokens';
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

  test('총계 열은 소계 열을 빼고 실제 데이터 열만 더한다', () => {
    const rows: GridGroup[] = [{ key: '매매목적', title: '매매목적', items: [lineItems[0], lineItems[1]] }];
    // 열: 자산(1) / 부채(2) / 소계(=3, 두 열의 합) / 총계
    const columns = {
      자산_value: [lineItems[0], lineItems[2]],
      부채_value: [lineItems[1], lineItems[3]],
      [subtotalKey('자산부채')]: lineItems,
      [grandTotalKey('col')]: lineItems,
    };

    expect(getGroupedData({ rows, columns, values: [VALUE] })).toEqual([
      {
        division: '매매목적',
        자산_value: 1,
        부채_value: 2,
        [subtotalKey('자산부채')]: 3,
        // 소계(3)를 다시 더하지 않으므로 6이 아니라 3이다.
        [grandTotalKey('col')]: 3,
      },
    ]);
  });

  test('총계 열은 열 순서와 무관하게 계산된다', () => {
    const rows: GridGroup[] = [{ key: '매매목적', title: '매매목적', items: [lineItems[0], lineItems[1]] }];
    const columns = {
      [grandTotalKey('col')]: lineItems,
      자산_value: [lineItems[0], lineItems[2]],
      부채_value: [lineItems[1], lineItems[3]],
    };

    expect(getGroupedData({ rows, columns, values: [VALUE] })[0][grandTotalKey('col')]).toBe(3);
  });

  test('값 그룹이 여러 개면 각 열은 자기 값 그룹만 집계한다', () => {
    //          자산                     부채
    //          amount  qty              amount  qty
    // 매매목적      1     10                  2    20
    // 위험회피목적   3     30                 43   430
    const multi: ILineItem[] = [
      { code: 'a', base: '당기말', [PURPOSE]: '매매목적', [SIDE]: '자산', amount: 1, qty: 10 },
      { code: 'b', base: '당기말', [PURPOSE]: '매매목적', [SIDE]: '부채', amount: 2, qty: 20 },
      { code: 'c', base: '당기말', [PURPOSE]: '위험회피목적', [SIDE]: '자산', amount: 3, qty: 30 },
      { code: 'd', base: '당기말', [PURPOSE]: '위험회피목적', [SIDE]: '부채', amount: 43, qty: 430 },
    ];
    const valueKeys = ['amount', 'qty'];

    const { gridGroups: rows } = transformToGridGroup({
      groupedData: groupByHierarchical(multi, [PURPOSE]),
      groups: [group(PURPOSE, '거래목적', 0)],
      showTotal: false,
      lineItems: multi,
    });

    const { gridGroups: columns } = transformToGridGroup({
      groupedData: groupByHierarchical(multi, [SIDE]),
      groups: [group(SIDE, '자산부채', 0)],
      showTotal: false,
      lineItems: multi,
      axis: 'col',
      values: valueKeys,
    });

    const data = getGroupedData({ rows, columns: getLeafColumnItemsMap(columns), values: valueKeys });

    // 이전에는 안쪽 루프가 row[colKey] 를 덮어써서 모든 열이 마지막 값 그룹(qty)을 보여줬다.
    expect(data).toEqual([
      { division: '매매목적', 자산_amount: 1, 자산_qty: 10, 부채_amount: 2, 부채_qty: 20 },
      { division: '위험회피목적', 자산_amount: 3, 자산_qty: 30, 부채_amount: 43, 부채_qty: 430 },
    ]);
  });

  test('값 그룹이 여러 개일 때 총계 열은 데이터 열을 한 번씩만 더한다', () => {
    const rows: GridGroup[] = [{ key: '매매목적', title: '매매목적', items: [lineItems[0], lineItems[1]] }];
    const columns = {
      자산_value: [lineItems[0], lineItems[2]],
      자산_qty: [lineItems[0], lineItems[2]],
      [grandTotalKey('col')]: lineItems,
    };

    const data = getGroupedData({ rows, columns, values: [VALUE, 'qty'] });
    // 자산_value=1, 자산_qty=0(qty 필드 없음) → 총계 1. 값 그룹 수만큼 곱해지지 않는다.
    expect(data[0].자산_value).toBe(1);
    expect(data[0][grandTotalKey('col')]).toBe(1);
  });

  test('행에 없는 항목만 든 열은 0이다', () => {
    const rows: GridGroup[] = [{ key: '매매목적', title: '매매목적', items: [lineItems[0]] }];
    const columns = { onlyOther: [lineItems[3]] };

    expect(getGroupedData({ rows, columns, values: [VALUE] })).toEqual([{ division: '매매목적', onlyOther: 0 }]);
  });
});
