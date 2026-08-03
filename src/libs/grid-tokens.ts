import { GridGroup } from '@/types/create-table.v2';

/** 집계 행/열에 붙는 제목. */
export const TOTAL_LABEL = {
  /** 한 그룹 안의 소계 */
  subtotal: '소계',
  /** 최상위 그룹을 걷어낸 축의 합계 */
  semiTotal: '합계',
  /** 전체 총계 */
  grandTotal: '총계',
} as const;

const TOTAL_LABELS: readonly string[] = Object.values(TOTAL_LABEL);

export const isTotalLabel = (title: string): boolean => TOTAL_LABELS.includes(title);

/**
 * 그리드 key 에 심는 표식.
 *
 * `getGroupedData` 가 만든 데이터 행은 열 이름만 들고 있으므로, 그 열이 집계
 * 열인지는 key 에 남은 이 조각으로 판별한다.
 */
const KEY_MARK = {
  subtotal: 'subtotal',
  total: 'total',
} as const;

/** 한 그룹의 소계 열/행 key. */
export const subtotalKey = (prefix: string) => `${prefix}_${KEY_MARK.subtotal}1`;

/** 합계 묶음 안쪽 key 들이 물려받는 접두사. */
export const SEMI_TOTAL_KEY_PREFIX = KEY_MARK.subtotal;

export const semiTotalKey = (axis: string) => `${axis}_semi_${KEY_MARK.total}`;

export const grandTotalKey = (axis: string) => `${axis}_${KEY_MARK.total}`;

export const isSubtotalKey = (key: string): boolean => key.includes(KEY_MARK.subtotal);

export const isTotalKey = (key: string): boolean => key.includes(KEY_MARK.total);

/** 소계·합계·총계 등 다른 셀을 합쳐 만든 열/행인지. */
export const isAggregateKey = (key: string): boolean => isSubtotalKey(key) || isTotalKey(key);

/** 제목이든 key 든 하나라도 집계를 가리키면 집계 행으로 본다. */
export const isTotalRow = ({ title, key }: Pick<GridGroup, 'title' | 'key'>): boolean =>
  isTotalLabel(title) || isSubtotalKey(key);

/**
 * 그리드 배경/글자색.
 *
 * Tailwind JIT 이 클래스 이름을 소스에서 문자열로 찾아내므로, 색 코드만 따로
 * 두지 않고 완성된 클래스 문자열을 그대로 보관한다.
 */
export const GRID_CLASS = {
  dataCell: 'bg-[#EDF0FE]',
  headerCell: 'bg-[#DCE2F7]',
  nestedHeaderCell: 'bg-[#B0BDEA]',
  totalCell: '!bg-[#C1C4CF]',
  unitCaption: 'text-[#535151]',
} as const;
