import { useCreateTableV2 } from '@/libs/hooks/useCreateTableV2';
import { grandTotalKey, isAggregateKey } from '@/libs/grid-tokens';
import { GridGroup, ILineItemGroup } from '@/types/create-table.v2';

import { TOTAL, colGroup, lineItems, rowGroup, valueGroup } from './get-table-data.fixture';

/**
 * `getTableData` 를 v2 형태 fixture 로 끝에서 끝까지 돌린다.
 *
 * 개별 헬퍼 테스트가 잡지 못하는 조립 단계(열 맵 생성 → 교차 집계 → 총계)를
 * 덮고, 대형 리팩터링 때 손으로 떴던 32조합 비교를 저장소에 남는 형태로
 * 재현할 수 있게 한다.
 */
const run = ({
  rows = rowGroup,
  cols = colGroup,
  vals = valueGroup,
  showRowsTotal = false,
  showColsTotal = false,
  amountUnit = 1,
}: {
  rows?: ILineItemGroup[];
  cols?: ILineItemGroup[];
  vals?: ILineItemGroup[];
  showRowsTotal?: boolean;
  showColsTotal?: boolean;
  amountUnit?: number;
} = {}) => {
  const { getTableData } = useCreateTableV2();
  // 축 배열은 호출 때마다 index 가 다시 매겨지므로 복사해서 넘긴다.
  return getTableData({
    lineItems,
    rowGroup: rows.map((g) => ({ ...g })),
    colGroup: cols.map((g) => ({ ...g })),
    valueGroup: vals.map((g) => ({ ...g })),
    amountUnit,
    showRowsTotal,
    showColsTotal,
    fieldHeaders: ['code', 'name'],
    groupHeaders: [],
  });
};

const leafKeys = (columns: GridGroup[]): string[] =>
  columns.flatMap((col) => (col.children?.length ? leafKeys(col.children) : [col.key]));

describe('getTableData — 행 + 값', () => {
  test('행 그룹만 있으면 행마다 값 합계를 낸다', () => {
    const { columns, rows, data } = run({ cols: [] });

    expect(columns.map(({ title }) => title)).toEqual(['상품', 'value']);
    expect(rows.map(({ title }) => title)).toEqual(['통화스왑', '통화선도', '이자율스왑', '이자율선도']);
    expect(data).toEqual([
      { division: '통화스왑', value: 49 },
      { division: '통화선도', value: 21 },
      { division: '이자율스왑', value: 87 },
      { division: '이자율선도', value: 260 },
    ]);
    expect(data.reduce((sum, row) => sum + Number(row.value), 0)).toBe(TOTAL);
  });

  test('행 총계를 켜면 총계 행이 전체 합이 된다', () => {
    const { rows, data } = run({ cols: [], showRowsTotal: true });

    expect(rows.at(-1)?.title).toBe('총계');
    expect(data.at(-1)).toEqual({ division: 'row_total', value: TOTAL });
  });
});

describe('getTableData — 행 + 열 + 값', () => {
  test('교차 셀은 그 행과 그 열에 함께 속한 항목만 합한다', () => {
    const { data } = run();

    // 통화스왑: 자산·매매 1 / 자산·위험회피 3 / 부채·매매 2 / 부채·위험회피 43
    expect(data[0]).toMatchObject({
      division: '통화스왑',
      자산_매매목적_value: 1,
      자산_위험회피목적_value: 3,
      부채_매매목적_value: 2,
      부채_위험회피목적_value: 43,
    });
  });

  test('소계 열은 자기 하위 잎 열의 합이다', () => {
    const { data } = run();

    for (const row of data) {
      expect(row.자산_subtotal1).toBe(Number(row.자산_매매목적_value) + Number(row.자산_위험회피목적_value));
      expect(row.부채_subtotal1).toBe(Number(row.부채_매매목적_value) + Number(row.부채_위험회피목적_value));
    }
  });

  test('총계 열은 소계를 제외한 데이터 열만 더한다', () => {
    const { columns, data } = run({ showColsTotal: true });
    const dataLeaves = leafKeys(columns).filter((key) => key !== 'division' && !isAggregateKey(key));

    for (const row of data) {
      const expected = dataLeaves.reduce((sum, key) => sum + Number(row[key] ?? 0), 0);
      expect(row[grandTotalKey('col')]).toBe(expected);
    }
  });

  test('행·열 총계를 모두 켜면 총계 행의 총계 열이 전체 합과 같다', () => {
    const { data } = run({ showRowsTotal: true, showColsTotal: true });

    const totalRow = data.find(({ division }) => division === 'row_total');
    expect(totalRow?.[grandTotalKey('col')]).toBe(TOTAL);
  });
});

describe('getTableData — 값 그룹 여러 개', () => {
  const twoValues: ILineItemGroup[] = [
    { id: 'value', name: 'value', showTotal: false },
    { id: 'code', name: 'code', showTotal: false },
  ];

  test('값 그룹마다 열이 하나씩 생기고 서로 다른 값을 집계한다', () => {
    const { columns, data } = run({ cols: [colGroup[0]], vals: twoValues });
    const leaves = leafKeys(columns).filter((key) => key !== 'division');

    expect(leaves).toEqual(['자산_value', '자산_code', '부채_value', '부채_code']);
    // code 는 숫자 문자열이라 value 와 반드시 다르다 — 열이 섞이면 바로 드러난다.
    expect(data[0].자산_value).toBe(4);
    expect(data[0].자산_code).toBe(112130700 + 112132000);
  });
});

describe('getTableData — 금액 단위', () => {
  test('단위를 주면 숫자 값이 그만큼 나뉜다', () => {
    const { data } = run({ cols: [], amountUnit: 1_000 });

    expect(data[0]).toEqual({ division: '통화스왑', value: 0.049 });
  });
});

describe('getTableData — 지원하지 않는 조합', () => {
  test('행·열·값이 모두 비면 기본 표를 낸다', () => {
    const { columns, rows } = run({ rows: [], cols: [], vals: [] });

    expect(columns.map(({ key }) => key)).toEqual(['code', 'name']);
    expect(rows).toEqual([]);
  });

  test('열만 있고 행이 없으면 빈 columns 를 돌려준다 (Report 가 경고를 띄운다)', () => {
    expect(run({ rows: [] }).columns).toEqual([]);
  });
});
