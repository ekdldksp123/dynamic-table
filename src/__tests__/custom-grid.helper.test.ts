import {
  amountToLocaleString,
  getAmountWithGivenUnit,
  getColSpan,
  getDataCountedInGivenUnits,
  getFirstColumn,
  getGroupedDataMaxDepth,
  getMaxDepth,
  getRowSpan,
  groupByHierarchical,
} from '@/libs/custom-grid.helper';
import { GridGroup, ILineItem } from '@/types/create-table.v2';

const PURPOSE = 'purpose';
const SIDE = 'side';

const item = (code: string, purpose: string, side: string, value: number): ILineItem => ({
  code,
  base: '당기말',
  [PURPOSE]: purpose,
  [SIDE]: side,
  value,
});

const items: ILineItem[] = [
  item('112130700', '매매목적', '자산', 1),
  item('205170700', '매매목적', '부채', 2),
  item('112132000', '위험회피목적', '자산', 3),
  item('205172000', '위험회피목적', '부채', 43),
];

describe('groupByHierarchical', () => {
  test('키 하나면 그 값별로 line item 을 묶는다', () => {
    expect(groupByHierarchical(items, [PURPOSE])).toEqual({
      매매목적: [items[0], items[1]],
      위험회피목적: [items[2], items[3]],
    });
  });

  test('키 여러개면 순서대로 중첩 그룹을 만든다', () => {
    expect(groupByHierarchical(items, [PURPOSE, SIDE])).toEqual({
      매매목적: { 자산: [items[0]], 부채: [items[1]] },
      위험회피목적: { 자산: [items[2]], 부채: [items[3]] },
    });
  });
});

describe('getFirstColumn', () => {
  test('키는 항상 division 이고, 제목은 그룹 이름을 쓴다', () => {
    expect(getFirstColumn({ id: 'g1', name: '거래목적', showTotal: false })).toEqual({
      key: 'division',
      title: '거래목적',
    });
  });

  test("이름이 '그룹'으로 시작하는 기본 이름이면 '구분'으로 대체한다", () => {
    expect(getFirstColumn({ id: 'g1', name: '그룹 1', showTotal: false })).toEqual({
      key: 'division',
      title: '구분',
    });
  });
});

describe('금액 단위 환산', () => {
  test('getAmountWithGivenUnit 은 단위로 나눈다', () => {
    expect(getAmountWithGivenUnit(12_345, 1_000)).toBeCloseTo(12.345);
  });

  test('getDataCountedInGivenUnits 는 숫자 필드만 환산하고 나머지는 그대로 둔다', () => {
    expect(getDataCountedInGivenUnits([{ division: 'a', value: 20_000 }], 10_000)).toEqual([
      { division: 'a', value: 2 },
    ]);
  });

  test('빈 데이터는 빈 배열이다', () => {
    expect(getDataCountedInGivenUnits([], 1_000)).toEqual([]);
  });

  test('amountToLocaleString 은 소수점 2자리까지만 보여준다', () => {
    expect(amountToLocaleString(1234.5678)).toBe('1,234.57');
  });
});

describe('span / depth 계산', () => {
  const leaf = (key: string): GridGroup => ({ key, title: key });
  const parent = (key: string, children: GridGroup[]): GridGroup => ({ key, title: key, children });

  test('getMaxDepth 는 자식이 없으면 1, 한 단계 중첩이면 2다', () => {
    expect(getMaxDepth([leaf('a'), leaf('b')])).toBe(1);
    expect(getMaxDepth([parent('p', [leaf('a')])])).toBe(2);
    expect(getMaxDepth([parent('p', [parent('q', [leaf('a')])])])).toBe(3);
  });

  test('getRowSpan 은 잎의 개수를 센다', () => {
    expect(getRowSpan(leaf('a'))).toBe(1);
    expect(getRowSpan(parent('p', [leaf('a'), leaf('b')]))).toBe(2);
    expect(getRowSpan(parent('p', [parent('q', [leaf('a'), leaf('b')]), leaf('c')]))).toBe(3);
  });

  test('getColSpan 은 잎의 개수를 세되, 행 헤더 자리인 첫 열은 행 깊이만큼 차지한다', () => {
    expect(getColSpan(leaf('a'), 1, 1)).toBe(1);
    expect(getColSpan(leaf('a'), 0, 3)).toBe(3);
    expect(getColSpan(parent('p', [leaf('a'), leaf('b')]), 1, 1)).toBe(2);
  });

  test('getGroupedDataMaxDepth 는 line item 배열에 닿기까지의 깊이를 센다', () => {
    expect(getGroupedDataMaxDepth(items)).toBe(0);
    expect(getGroupedDataMaxDepth(groupByHierarchical(items, [PURPOSE]))).toBe(1);
    expect(getGroupedDataMaxDepth(groupByHierarchical(items, [PURPOSE, SIDE]))).toBe(2);
  });
});
