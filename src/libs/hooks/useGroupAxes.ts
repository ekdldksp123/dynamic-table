import update from 'immutability-helper';
import { useCallback, useState } from 'react';

import { GroupType, ILineItemGroup } from '@/types/create-table.v2';

/** level 이 없는 그룹의 기준값. 실제 level 보다 항상 작아야 한다. */
export const UNSET_LEVEL = -1;

export const GROUP_TYPES: readonly GroupType[] = ['row', 'column', 'value'] as const;

/** 행/열/값 각 축에 배치된 그룹. */
export type GroupAxes = Record<GroupType, ILineItemGroup[]>;

export const emptyGroupAxes = (): GroupAxes => ({ row: [], column: [], value: [] });

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

  const setAxis = useCallback(
    (type: GroupType, groups: ILineItemGroup[]) => {
      updateAxis(type, () => groups);
    },
    [updateAxis],
  );

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

  return { axes, setAxis, moveGroup, removeGroup, setGroupShowTotal, maxLevelOf };
};
