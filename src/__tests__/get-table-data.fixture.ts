import { ILineItem, ILineItemGroup, IReportConfig } from '@/types/create-table.v2';

/**
 * `db.json` 의 첫 보고서를 v2 형태로 옮긴 fixture.
 *
 * 저장된 `db.json` 은 아직 v1 형태(`groupId`/`axis`)라 v2 코드가 읽지 못한다
 * (DEFERRED-ISSUES.md 참조). 마이그레이션 자체는 제품 판단이 필요하므로
 * 데이터는 그대로 두고, 검증용으로 같은 내용을 v2 형태로 여기에 둔다.
 */
const GROUP = {
  product: 'b1dbdcf1-5d15-43a8-b58f-627bb762700b',
  side: '524022e7-afd0-426f-be7c-d080db26b76f',
  purpose: '08b61dce-c12c-49c7-af71-e1cb820f1fdb',
} as const;

const item = (code: string, name: string, product: string, side: string, purpose: string, value: number): ILineItem => ({
  code,
  name,
  base: '당기말',
  value,
  [GROUP.product]: product,
  [GROUP.side]: side,
  [GROUP.purpose]: purpose,
});

export const lineItems: ILineItem[] = [
  item('112130700', '통화스왑_매매', '통화스왑', '자산', '매매목적', 1),
  item('205170700', '통화스왑_매매', '통화스왑', '부채', '매매목적', 2),
  item('112132000', '통화스왑_헷지', '통화스왑', '자산', '위험회피목적', 3),
  item('205172000', '통화스왑_헷지', '통화스왑', '부채', '위험회피목적', 43),
  item('112130500', '통화선도_매매', '통화선도', '자산', '매매목적', 4),
  item('205170500', '통화선도_매매', '통화선도', '부채', '매매목적', 5),
  item('112131800', '통화선도_헷지', '통화선도', '자산', '위험회피목적', 6),
  item('205171800', '통화선도_헷지', '통화선도', '부채', '위험회피목적', 6),
  item('112130300', '이자율스왑_매매', '이자율스왑', '자산', '매매목적', 7),
  item('205170300', '이자율스왑_매매', '이자율스왑', '부채', '매매목적', 78),
  item('112131600', '이자율스왑_헷지', '이자율스왑', '자산', '위험회피목적', 1),
  item('205171600', '이자율스왑_헷지', '이자율스왑', '부채', '위험회피목적', 1),
  item('112130100', '이자율선도_매매', '이자율선도', '자산', '매매목적', 23),
  item('205170100', '이자율선도_매매', '이자율선도', '부채', '매매목적', 3),
  item('112131400', '이자율선도_헷지', '이자율선도', '자산', '위험회피목적', 21),
  item('205171400', '이자율선도_헷지', '이자율선도', '부채', '위험회피목적', 213),
];

/** 전체 합계 — 총계 검증의 기준값. */
export const TOTAL = lineItems.reduce((sum, { value }) => sum + Number(value), 0);

export const rowGroup: ILineItemGroup[] = [
  { id: GROUP.product, name: '상품', level: 1, type: 'row', showTotal: false },
];

export const colGroup: ILineItemGroup[] = [
  { id: GROUP.side, name: '자산부채', level: 2, type: 'column', showTotal: true },
  { id: GROUP.purpose, name: '거래목적', level: 3, type: 'column', showTotal: false },
];

export const valueGroup: ILineItemGroup[] = [{ id: 'value', name: 'value', showTotal: false }];

export const report: IReportConfig = {
  id: '1',
  name: '주석 10_01 (v2)',
  items: lineItems,
  groups: [...rowGroup, ...colGroup],
  rowGroup,
  colGroup,
  valueGroup,
  showRowsTotal: true,
  showColsTotal: true,
};
