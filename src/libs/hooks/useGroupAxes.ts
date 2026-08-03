import update from 'immutability-helper';
import { useCallback, useState } from 'react';

import { GroupType, ILineItemGroup, IReportConfig } from '@/types/create-table.v2';

/** level 이 없는 그룹의 기준값. 실제 level 보다 항상 작아야 한다. */
export const UNSET_LEVEL = -1;

export const GROUP_TYPES: readonly GroupType[] = ['row', 'column', 'value'] as const;

/** 행/열/값 각 축에 배치된 그룹. */
export type GroupAxes = Record<GroupType, ILineItemGroup[]>;

export const emptyGroupAxes = (): GroupAxes => ({ row: [], column: [], value: [] });

/** 각 그룹에 표시된 `type` 으로 축을 세운다. */
const deriveAxesFromGroupTypes = (groups: ILineItemGroup[]): GroupAxes => {
  const derived = emptyGroupAxes();
  for (const group of groups) {
    if (group.type) derived[group.type] = [...derived[group.type], group];
  }
  return derived;
};

/**
 * 보고서 설정으로 축의 초기 상태를 만든다.
 *
 * 축별로 따로 판단한다 — 저장된 축이 있으면 그대로 쓰고, 비어 있으면 그룹에
 * 표시된 `type` 에서 끌어온다. 저장된 보고서에 `valueGroup` 이 없는 경우가
 * 흔하므로, 행/열이 저장되어 있다는 이유로 값 축을 비워두면 안 된다.
 */
export const initialGroupAxes = ({
  groups,
  rowGroup,
  colGroup,
  valueGroup,
}: Pick<IReportConfig, 'groups' | 'rowGroup' | 'colGroup' | 'valueGroup'>): GroupAxes => {
  const saved: GroupAxes = {
    row: [...(rowGroup ?? [])],
    column: [...(colGroup ?? [])],
    value: [...(valueGroup ?? [])],
  };

  const derived = deriveAxesFromGroupTypes(groups ?? []);

  return {
    row: saved.row.length ? saved.row : derived.row,
    column: saved.column.length ? saved.column : derived.column,
    value: saved.value.length ? saved.value : derived.value,
  };
};

/**
 * 그룹을 한 축으로 옮긴다. 축은 서로 배타적이므로 다른 축에서는 빠진다.
 *
 * 이미 그 축에 있으면 순서가 흐트러지지 않도록 그대로 둔다.
 */
export const moveGroupToAxis = (axes: GroupAxes, type: GroupType, group: ILineItemGroup): GroupAxes => {
  if (axes[type].some(({ id }) => id === group.id)) return axes;

  const next = emptyGroupAxes();
  for (const axis of GROUP_TYPES) {
    next[axis] = axes[axis].filter(({ id }) => id !== group.id);
  }
  next[type] = [...next[type], { ...group, type }];

  return next;
};

/**
 * 세 축을 같은 방식으로 다루기 위한 상태.
 *
 * 축마다 따로 state 와 핸들러를 두면 세 벌이 서로 조금씩 달라지기 쉬우므로,
 * 축을 인자로 받는 하나의 조작 묶음만 노출한다.
 */
export const useGroupAxes = (initial: GroupAxes) => {
  const [axes, setAxes] = useState<GroupAxes>(initial);

  const updateAxis = useCallback((type: GroupType, updater: (groups: ILineItemGroup[]) => ILineItemGroup[]) => {
    setAxes((prev) => ({ ...prev, [type]: updater(prev[type]) }));
  }, []);

  /** 그룹 선택 UI 가 그룹을 이 축으로 옮길 때 쓴다. */
  const assignGroupToAxis = useCallback((type: GroupType, group: ILineItemGroup) => {
    setAxes((prev) => moveGroupToAxis(prev, type, group));
  }, []);

  /** 드래그로 축 안에서 순서를 바꾼다. */
  const moveGroup = useCallback(
    (type: GroupType, dragIndex: number, hoverIndex: number) => {
      updateAxis(type, (groups) =>
        update(groups, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, groups[dragIndex]],
          ],
        }),
      );
    },
    [updateAxis],
  );

  const removeGroup = useCallback(
    (type: GroupType, id: string) => {
      updateAxis(type, (groups) => groups.filter((group) => group.id !== id));
    },
    [updateAxis],
  );

  const setGroupShowTotal = useCallback(
    (type: GroupType, index: number, showTotal: boolean) => {
      updateAxis(type, (groups) => {
        groups[index].showTotal = showTotal;
        return [...groups];
      });
    },
    [updateAxis],
  );

  /** 축 안에서 가장 깊은 그룹의 level. 그 그룹의 소계는 곧 축 전체의 총계다. */
  const maxLevelOf = useCallback(
    (type: GroupType) => Math.max(...axes[type].map(({ level }) => level ?? UNSET_LEVEL)),
    [axes],
  );

  return { axes, assignGroupToAxis, moveGroup, removeGroup, setGroupShowTotal, maxLevelOf };
};
