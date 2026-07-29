import { getLeafColumnItemsMap, groupByHierarchical, transformToGridGroup } from '@/libs/custom-grid.helper';
import { GridGroup, ILineItem, ILineItemGroup } from '@/types/create-table.v2';

const PURPOSE = 'purpose';
const SIDE = 'side';

const item = (code: string, purpose: string, side: string, value: number): ILineItem => ({
  code,
  base: '당기말',
  [PURPOSE]: purpose,
  [SIDE]: side,
  value,
});

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

const purposeThenSide = [group(PURPOSE, '거래목적', 0), group(SIDE, '자산부채', 1)];

const titles = (groups: GridGroup[] = []) => groups.map(({ title }) => title);

describe('transformToGridGroup — 행 축', () => {
  test('그룹 순서대로 중첩된 행 헤더를 만든다', () => {
    const { gridGroups } = transformToGridGroup({
      groupedData: groupByHierarchical(lineItems, [PURPOSE, SIDE]),
      groups: purposeThenSide,
      showTotal: false,
      lineItems,
    });

    expect(titles(gridGroups)).toEqual(['매매목적', '위험회피목적']);
    expect(titles(gridGroups[0].children)).toEqual(['자산', '부채']);
    expect(gridGroups[0].children?.[0].key).toBe('매매목적_자산');
  });

  test('showTotal 이면 합계/총계 행을 덧붙인다 (예전에는 여기서 터졌다)', () => {
    const run = () =>
      transformToGridGroup({
        groupedData: groupByHierarchical(lineItems, [PURPOSE, SIDE]),
        groups: purposeThenSide,
        showTotal: true,
        lineItems,
      });

    expect(run).not.toThrow();

    const { gridGroups } = run();
    expect(titles(gridGroups)).toEqual(['매매목적', '위험회피목적', '합계', '총계']);

    // 합계는 최상위 그룹을 걷어낸 나머지 축으로 다시 묶는다.
    const semiTotal = gridGroups[2];
    expect(titles(semiTotal.children)).toEqual(['자산', '부채']);
    expect(semiTotal.children?.map(({ key }) => key)).toEqual(['subtotal_자산', 'subtotal_부채']);
  });

  test('그룹이 하나면 합계 없이 총계만 붙는다', () => {
    const { gridGroups } = transformToGridGroup({
      groupedData: groupByHierarchical(lineItems, [SIDE]),
      groups: [group(SIDE, '자산부채', 0)],
      showTotal: true,
      lineItems,
    });

    expect(titles(gridGroups)).toEqual(['자산', '부채', '총계']);
  });
});

describe('transformToGridGroup — 열 축', () => {
  test('값 그룹마다 잎 열을 하나씩 펼친다', () => {
    const { gridGroups } = transformToGridGroup({
      groupedData: groupByHierarchical(lineItems, [SIDE]),
      groups: [group(SIDE, '자산부채', 0)],
      showTotal: false,
      lineItems,
      axis: 'col',
      values: ['value'],
    });

    expect(titles(gridGroups)).toEqual(['자산', '부채']);
    expect(gridGroups[0].children).toEqual([
      { title: 'value', key: '자산_value', index: 0, items: [lineItems[0], lineItems[2]] },
    ]);
    // 잎이 값을 들고 있으므로 그룹 자체는 items 를 비운다.
    expect(gridGroups[0].items).toBeUndefined();
  });
});

describe('getLeafColumnItemsMap', () => {
  test('잎 열의 key 로 그 열의 line item 을 찾을 수 있다', () => {
    const { gridGroups } = transformToGridGroup({
      groupedData: groupByHierarchical(lineItems, [SIDE]),
      groups: [group(SIDE, '자산부채', 0)],
      showTotal: false,
      lineItems,
      axis: 'col',
      values: ['value'],
    });

    expect(getLeafColumnItemsMap(gridGroups)).toEqual({
      자산_value: [lineItems[0], lineItems[2]],
      부채_value: [lineItems[1], lineItems[3]],
    });
  });

  test('중간 그룹은 건너뛰고 items 가 없는 잎은 빈 배열이 된다', () => {
    const columns: GridGroup[] = [
      { key: 'division', title: '구분' },
      { key: 'parent', title: 'parent', children: [{ key: 'leaf', title: 'leaf', items: [lineItems[0]] }] },
    ];

    expect(getLeafColumnItemsMap(columns)).toEqual({
      division: [],
      leaf: [lineItems[0]],
    });
  });
});
