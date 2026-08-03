import {
  GridData,
  GridGroup,
  GroupedData,
  ILineItem,
  ILineItemGroup,
  KeyTypeFromItemValue,
  LineItemKey,
} from '@/types/create-table.v2';

import {
  SEMI_TOTAL_KEY_PREFIX,
  TOTAL_LABEL,
  grandTotalKey,
  isAggregateKey,
  semiTotalKey,
  subtotalKey,
} from './grid-tokens';

export const getMaxDepth = (columns: GridGroup[]): number => {
  return columns.reduce((depth, column) => {
    if (column.children) {
      return Math.max(depth, getMaxDepth(column.children) + 1);
    }
    return depth;
  }, 1);
};

export const getAmountWithGivenUnit = (value: number, unit: number) => {
  return value / unit;
};

export const getDataCountedInGivenUnits = (data: GridData[], unit: number) => {
  if (!data.length) return [];

  const keys = Object.keys(data[0]);
  return data.map((row) => {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'number') {
        row[key] = getAmountWithGivenUnit(value, unit);
      }
    }
    return row;
  });
};

export const getFirstColumn = (group: ILineItemGroup): GridGroup => {
  const colName = group.name.startsWith('그룹') ? '구분' : group.name;
  return { key: 'division', title: colName };
};

export const groupByHierarchical = (data: ILineItem[], keys: LineItemKey[]): GroupedData => {
  const groupByRecursively = (items: ILineItem[], remainingKeys: LineItemKey[]): GroupedData | ILineItem[] => {
    if (remainingKeys.length === 0) {
      return items;
    }
    const [currentKey] = remainingKeys;
    return items.reduce((result, item) => {
      const groupKey = item[currentKey] as unknown as KeyTypeFromItemValue;
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      (result[groupKey] as unknown as ILineItem[]).push(item);
      return result;
    }, {} as GroupedData);
  };

  const nestedGroupBy = (groupedData: GroupedData, keys: LineItemKey[]): GroupedData => {
    if (keys.length === 0) return groupedData;

    const [currentKey, ...nextKeys] = keys;
    for (const key in groupedData) {
      if (Array.isArray(groupedData[key])) {
        groupedData[key] = groupByRecursively(groupedData[key] as unknown as ILineItem[], [currentKey]);
        nestedGroupBy(groupedData[key] as GroupedData, nextKeys);
      }
    }
    return groupedData;
  };

  const initialGroup = groupByRecursively(data, [keys[0]]);
  return nestedGroupBy(initialGroup as GroupedData, keys.slice(1));
};

/**
 * 헤더 트리의 잎(= 실제 데이터가 들어가는 열)마다 그 열에 속한 line item 을
 * 모아준다. `getGroupedData` 가 행 × 열 교차값을 계산할 때 쓴다.
 *
 * 잎에서 뽑아내므로 헤더에 그려지는 열과 데이터 맵의 키가 어긋날 수 없다.
 */
export const getLeafColumnItemsMap = (columns: GridGroup[]): Record<string, ILineItem[]> => {
  const map: Record<string, ILineItem[]> = {};

  const collect = (column: GridGroup) => {
    if (column.children?.length) {
      column.children.forEach(collect);
      return;
    }
    map[column.key] = column.items ?? [];
  };

  columns.forEach(collect);
  return map;
};

export interface ITransformToGridGroup {
  groupedData: GroupedData;
  groups: ILineItemGroup[];
  showTotal: boolean;
  lineItems: ILineItem[];
  axis?: 'col' | 'row';
  values?: string[];
}

/** 그룹 값이 아니라 자료구조의 흔적인 key. 헤더로 만들지 않는다. */
const isNotAGroupValue = (key: string) => key === 'groupId' || key === 'null' || key === '';

const isLeafOf = (data: GroupedData, key: string) => Array.isArray(data[key]);

const itemsOf = (data: GroupedData, key: string): ILineItem[] =>
  isLeafOf(data, key) ? (data[key] as unknown as ILineItem[]) : [];

/**
 * 같은 제목이 여러 자리에 나타날 수 있으므로, 제목이 등장한 자리들 중 가장 큰
 * RN 을 그 제목의 순서로 본다.
 */
const orderOf = (title: string, groupsOrderMap: Record<string, number>): number => {
  const orders = Object.keys(groupsOrderMap)
    .filter((key) => key.includes(title))
    .map((key) => groupsOrderMap[key])
    .sort((x, y) => y - x);

  return orders[0];
};

const byGroupOrder =
  (groupsOrderMap: Record<string, number>) =>
  (a: GridGroup, b: GridGroup): number =>
    orderOf(a.title, groupsOrderMap) - orderOf(b.title, groupsOrderMap);

/**
 * 자식들을 합친 소계 노드.
 *
 * 자식이 이미 잎이면 그 항목들을 그대로 쓰고, 자식이 또 그룹이면 손자에서
 * 항목을 끌어올린다 — 이때 손자의 소계는 중복이므로 제외한다.
 */
const buildSubtotalGroup = ({ currentName, children, index }: SubtotalGroupInput): GridGroup => {
  const directItems = children.flatMap((child) => child.items ?? []);

  return {
    index: index + 1,
    key: subtotalKey(currentName),
    title: TOTAL_LABEL.subtotal,
    items: directItems.length
      ? directItems
      : children.flatMap((child) =>
          (child.children ?? []).flatMap((c) => (c.title === TOTAL_LABEL.subtotal ? [] : (c.items ?? [])) as ILineItem[]),
        ),
  };
};

interface SubtotalGroupInput {
  currentName: string;
  children: GridGroup[];
  index: number;
}

/**
 * 열 축의 잎 그룹은 값 그룹마다 열을 하나씩 갖는다. 실제 데이터가 들어가는 자리는
 * 이 잎들이므로 그룹 자신은 items 를 비운다.
 */
const expandValueColumns = (groupDef: GridGroup, items: ILineItem[], values: string[], index: number) => {
  groupDef.items = undefined;
  groupDef.children = values.map((valueKey) => ({
    title: valueKey,
    key: `${groupDef.key}_${valueKey}`,
    index,
    items,
  }));
};

export const transformToGridGroup = ({
  groupedData,
  groups,
  showTotal,
  lineItems,
  axis = 'row',
  values,
}: ITransformToGridGroup): {
  gridGroups: GridGroup[];
  groupsOrderMap: Record<string, number>;
} => {
  // 소계를 보여줘야 하는 그룹의 깊이
  const subtotalDepths = new Set(
    groups.filter(({ showTotal, index }) => showTotal === true && index !== undefined).map(({ index }) => index),
  );

  const groupsOrderMap: Record<string, number> = {};

  const traverse = (data: GroupedData | ILineItem[], parentName: string | null, index = 0): GridGroup[] => {
    if (Array.isArray(data)) {
      if (parentName) {
        groupsOrderMap[parentName] = Math.max(...data.map((item) => item.RN as number));
      }
      return [];
    }

    return Object.keys(data)
      .filter((key) => !isNotAGroupValue(key))
      .map((key) => {
        const currentName = parentName ? `${parentName}_${key}` : key;

        const groupDef: GridGroup = {
          title: key,
          key: currentName,
          index,
          items: isLeafOf(data, key) ? itemsOf(data, key) : undefined,
        };

        const children = traverse(data[key] as GroupedData | ILineItem[], currentName, index + 1);

        if (children.length) {
          children.sort(byGroupOrder(groupsOrderMap));

          if (subtotalDepths.has(index)) {
            const subtotalGroup = buildSubtotalGroup({ currentName, children, index });

            // 행 축에서는 소계 행이 하위 그룹 열들을 가로질러 뻗는다.
            // NOTE: custom-grid-v2 는 colSpan 을 제목으로 다시 계산하므로 이 값을
            // 읽지 않는다. DEFERRED-ISSUES.md 에 남겨두었다.
            if (axis === 'row') {
              subtotalGroup.colSpan = children.some((child) => child.items?.length)
                ? undefined
                : getGroupedDataMaxDepth(data[key] as GroupedData | ILineItem[]);
            }
            children.push(subtotalGroup);
          }

          groupDef.children = children;
        } else if (axis === 'col' && values?.length) {
          expandValueColumns(groupDef, itemsOf(data, key), values, index);
        }

        return groupDef;
      });
  };

  const gridGroups = traverse(groupedData, null);

  if (showTotal) {
    gridGroups.push(...buildTotalGroups({ groups, lineItems, axis, traverse }));
  }

  return { gridGroups, groupsOrderMap };
};

interface TotalGroupsInput {
  groups: ILineItemGroup[];
  lineItems: ILineItem[];
  axis: 'col' | 'row';
  traverse: (data: GroupedData, parentName: string) => GridGroup[];
}

/**
 * 축 맨 끝에 붙는 합계/총계.
 *
 * 최상위 그룹을 걷어낸 나머지 축으로 다시 묶어 합계를 만들되, 그렇게 묶어도
 * 묶음이 하나뿐이면 총계와 다를 바 없으므로 총계만 붙인다.
 */
const buildTotalGroups = ({ groups, lineItems, axis, traverse }: TotalGroupsInput): GridGroup[] => {
  const grandTotal: GridGroup = { key: grandTotalKey(axis), title: TOTAL_LABEL.grandTotal, items: lineItems };

  const groupedSemiTotal = groupByHierarchical(
    lineItems,
    groups.filter(({ index }) => index !== 0).map(({ id }) => id),
  );

  if (Object.keys(groupedSemiTotal).length <= 1) {
    return [grandTotal];
  }

  return [
    {
      key: semiTotalKey(axis),
      title: TOTAL_LABEL.semiTotal,
      children: traverse(groupedSemiTotal, SEMI_TOTAL_KEY_PREFIX),
    },
    grandTotal,
  ];
};

interface IGetGroupedData {
  rows: GridGroup[];
  columns: Record<string, ILineItem[]>;
  values: string[];
}

const sumValue = (items: ILineItem[], valueKey: string) =>
  items.reduce((sum, item) => {
    const value = Number(item[valueKey]);
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);

/**
 * 행과 열은 같은 lineItems 배열을 각각 다른 기준으로 묶은 것이므로, 교차 셀에
 * 들어갈 항목은 두 쪽에 함께 등장하는 '같은 객체'다.
 */
const sumCrossing = (colItems: ILineItem[], rowItems: Set<ILineItem>, valueKey: string) =>
  sumValue(
    colItems.filter((colItem) => rowItems.has(colItem)),
    valueKey,
  );

/**
 * 데이터 열의 key 는 `${그룹경로}_${값그룹}` 이므로, 그 열이 어떤 값 그룹을
 * 나타내는지는 접미사로 알 수 있다. 소계/총계 열에는 값 접미사가 없다.
 */
const valueKeyOfColumn = (colKey: string, values: string[]) =>
  values.find((valueKey) => colKey.endsWith(`_${valueKey}`));

/** 행 × 열 교차 집계. 총계 열은 실제 데이터 열만 합쳐서 따로 채운다. */
const fillCrossColumns = (
  row: GridData,
  columns: Record<string, ILineItem[]>,
  rowItems: Set<ILineItem>,
  values: string[],
) => {
  // 소계/합계 열은 이미 다른 열을 합친 값이라, 총계에 다시 더하면 중복 집계된다.
  let grandTotal = 0;

  for (const colKey of Object.keys(columns)) {
    const valueKey = valueKeyOfColumn(colKey, values);

    // 값 그룹이 특정되는 데이터 열은 그 값만 집계한다. 값 접미사가 없는
    // 소계/총계 열은 모든 값 그룹을 합친다.
    const value = valueKey
      ? sumCrossing(columns[colKey], rowItems, valueKey)
      : values.reduce((sum, key) => sum + sumCrossing(columns[colKey], rowItems, key), 0);

    row[colKey] = value;

    if (!isAggregateKey(colKey)) {
      grandTotal += value;
    }
  }

  const grandTotalColumnKey = grandTotalKey('col');
  if (grandTotalColumnKey in row) {
    row[grandTotalColumnKey] = grandTotal;
  }
};

/** 열 그룹이 없으면 값 그룹마다 그 행의 합계만 낸다. */
const fillRowValues = (row: GridData, items: ILineItem[] | undefined, values: string[]) => {
  for (const valueKey of values) {
    row[valueKey] = items ? sumValue(items, valueKey) : undefined;
  }
};

export const getGroupedData = ({ rows, columns, values }: IGetGroupedData) => {
  const data: GridData[] = [];
  const hasColumns = Object.keys(columns).length > 0;

  const buildRow = ({ items, key }: GridGroup): GridData => {
    const row: GridData = { division: key };
    const rowItems = new Set(items ?? []);

    if (hasColumns) {
      fillCrossColumns(row, columns, rowItems, values);
    } else {
      fillRowValues(row, items, values);
    }

    return row;
  };

  // 잎 행만 데이터가 된다. 중간 그룹 행은 자식을 타고 내려간다.
  const collectLeafRows = (group: GridGroup) => {
    if (!group.items && group.children) {
      group.children.forEach(collectLeafRows);
      return;
    }
    data.push(buildRow(group));
  };

  rows.forEach(collectLeafRows);
  return data;
};

export const amountToLocaleString = (amount: number) => {
  return amount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
};

export const getRowSpan = (row: GridGroup): number => {
  if (!row.children || !row.children.length) return 1;
  return row.children.reduce((depth, child) => depth + getRowSpan(child), 0);
};

export const getColSpan = (col: GridGroup, idx: number, rowMaxDepth: number): number => {
  if (!col.children || !col.children.length) {
    if (idx === 0 && rowMaxDepth > 1) {
      return rowMaxDepth;
    }
    return 1;
  }
  return col.children.reduce((span, child, index) => span + getColSpan(child, index, rowMaxDepth), 0);
};

export const getGroupedDataMaxDepth = (data: GroupedData | ILineItem[], currentDepth = 0) => {
  if (Array.isArray(data)) {
    return currentDepth;
  }

  let maxDepth = currentDepth;
  for (const key in data) {
    const child = data[key];
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      maxDepth = Math.max(maxDepth, getGroupedDataMaxDepth(child, currentDepth + 1));
    }
  }

  return maxDepth;
};
