import {
  GRID_CLASS,
  SEMI_TOTAL_KEY_PREFIX,
  TOTAL_LABEL,
  grandTotalKey,
  isAggregateKey,
  isSubtotalKey,
  isTotalKey,
  isTotalLabel,
  isTotalRow,
  semiTotalKey,
  subtotalKey,
} from '@/libs/grid-tokens';

describe('집계 key 만들기', () => {
  test('리팩터링 전에 쓰던 key 문자열을 그대로 만든다', () => {
    expect(subtotalKey('자산_매매목적')).toBe('자산_매매목적_subtotal1');
    expect(grandTotalKey('col')).toBe('col_total');
    expect(grandTotalKey('row')).toBe('row_total');
    expect(semiTotalKey('col')).toBe('col_semi_total');
    expect(SEMI_TOTAL_KEY_PREFIX).toBe('subtotal');
  });
});

describe('집계 여부 판별', () => {
  test('isSubtotalKey / isTotalKey 는 key 에 심긴 표식을 본다', () => {
    expect(isSubtotalKey(subtotalKey('자산'))).toBe(true);
    expect(isSubtotalKey(`${SEMI_TOTAL_KEY_PREFIX}_매매목적_value`)).toBe(true);
    expect(isSubtotalKey('자산_value')).toBe(false);

    expect(isTotalKey(grandTotalKey('col'))).toBe(true);
    expect(isTotalKey(semiTotalKey('row'))).toBe(true);
    expect(isTotalKey('자산_value')).toBe(false);
  });

  test('isAggregateKey 는 소계와 총계를 모두 잡는다', () => {
    expect(isAggregateKey(subtotalKey('자산'))).toBe(true);
    expect(isAggregateKey(grandTotalKey('col'))).toBe(true);
    expect(isAggregateKey('자산_value')).toBe(false);
  });

  test('isTotalLabel 은 소계/합계/총계 세 제목만 인정한다', () => {
    expect(isTotalLabel(TOTAL_LABEL.subtotal)).toBe(true);
    expect(isTotalLabel(TOTAL_LABEL.semiTotal)).toBe(true);
    expect(isTotalLabel(TOTAL_LABEL.grandTotal)).toBe(true);
    expect(isTotalLabel('자산')).toBe(false);
  });

  test('isTotalRow 는 제목이나 key 중 하나라도 집계면 참이다', () => {
    expect(isTotalRow({ title: TOTAL_LABEL.grandTotal, key: 'row_total' })).toBe(true);
    expect(isTotalRow({ title: '자산', key: subtotalKey('자산') })).toBe(true);
    expect(isTotalRow({ title: '자산', key: '자산' })).toBe(false);
  });
});

describe('색 토큰', () => {
  test('Tailwind 가 스캔할 수 있도록 완성된 클래스 문자열을 담는다', () => {
    expect(Object.values(GRID_CLASS)).toEqual([
      'bg-[#EDF0FE]',
      'bg-[#DCE2F7]',
      'bg-[#B0BDEA]',
      '!bg-[#C1C4CF]',
      'text-[#535151]',
    ]);
  });
});
