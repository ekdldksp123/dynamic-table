import { GroupAxes, emptyGroupAxes, initialGroupAxes, moveGroupToAxis } from '@/libs/hooks/useGroupAxes';
import { GroupType, ILineItemGroup } from '@/types/create-table.v2';

const group = (id: string, type?: GroupType): ILineItemGroup => ({
  id,
  name: `Group ${id}`,
  showTotal: false,
  ...(type ? { type } : {}),
});

const axesOf = (partial: Partial<Record<GroupType, ILineItemGroup[]>>): GroupAxes => ({
  ...emptyGroupAxes(),
  ...partial,
});

describe('moveGroupToAxis', () => {
  test('빈 축에 그룹을 넣으면서 type 을 함께 붙인다', () => {
    const next = moveGroupToAxis(emptyGroupAxes(), 'value', group('a'));

    expect(next.value).toEqual([{ id: 'a', name: 'Group a', showTotal: false, type: 'value' }]);
    expect(next.row).toEqual([]);
    expect(next.column).toEqual([]);
  });

  test('축은 배타적이므로 다른 축에 있던 그룹은 빠진다', () => {
    const before = axesOf({ column: [group('a', 'column'), group('b', 'column')] });
    const next = moveGroupToAxis(before, 'row', group('a', 'column'));

    expect(next.column.map(({ id }) => id)).toEqual(['b']);
    expect(next.row.map(({ id }) => id)).toEqual(['a']);
    expect(next.row[0].type).toBe('row');
  });

  test('기존 축 끝에 덧붙인다', () => {
    const before = axesOf({ row: [group('a', 'row')] });
    const next = moveGroupToAxis(before, 'row', group('b'));

    expect(next.row.map(({ id }) => id)).toEqual(['a', 'b']);
  });

  test('이미 그 축에 있으면 순서를 건드리지 않고 그대로 둔다', () => {
    const before = axesOf({ row: [group('a', 'row'), group('b', 'row')] });
    const next = moveGroupToAxis(before, 'row', group('a', 'row'));

    expect(next).toBe(before);
  });

  test('원본을 변형하지 않는다', () => {
    const before = axesOf({ column: [group('a', 'column')] });
    moveGroupToAxis(before, 'row', group('a', 'column'));

    expect(before.column.map(({ id }) => id)).toEqual(['a']);
    expect(before.row).toEqual([]);
  });
});

describe('initialGroupAxes', () => {
  test('저장된 축이 있으면 그대로 쓴다', () => {
    const axes = initialGroupAxes({
      groups: [group('a', 'row'), group('b', 'column')],
      rowGroup: [group('x', 'row')],
      colGroup: [group('y', 'column')],
      valueGroup: [group('z', 'value')],
    });

    expect(axes.row.map(({ id }) => id)).toEqual(['x']);
    expect(axes.column.map(({ id }) => id)).toEqual(['y']);
    expect(axes.value.map(({ id }) => id)).toEqual(['z']);
  });

  test('저장된 축이 없으면 그룹의 type 으로 세운다', () => {
    const axes = initialGroupAxes({
      groups: [group('a', 'row'), group('b', 'column'), group('c', 'value'), group('d')],
    });

    expect(axes.row.map(({ id }) => id)).toEqual(['a']);
    expect(axes.column.map(({ id }) => id)).toEqual(['b']);
    expect(axes.value.map(({ id }) => id)).toEqual(['c']);
  });

  test('행/열만 저장된 보고서에서도 값 축은 type 으로 채운다', () => {
    const axes = initialGroupAxes({
      groups: [group('a', 'row'), group('v', 'value')],
      rowGroup: [group('a', 'row')],
      colGroup: [group('b', 'column')],
      // valueGroup 없음 — db.json 의 모든 보고서가 이 상태다
    });

    expect(axes.row.map(({ id }) => id)).toEqual(['a']);
    expect(axes.column.map(({ id }) => id)).toEqual(['b']);
    expect(axes.value.map(({ id }) => id)).toEqual(['v']);
  });

  test('설정이 비어 있으면 세 축 모두 빈 배열이다', () => {
    expect(initialGroupAxes({})).toEqual(emptyGroupAxes());
  });
});
