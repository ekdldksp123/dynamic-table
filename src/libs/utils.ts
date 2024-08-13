import { GroupedData, ILineItem, KeyTypeFromItemValue, LineItemKey } from '@/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const areStringArraysEqual = (arr1: string[], arr2: string[]): boolean => {
  if (arr1.length !== arr2.length) return false; // 배열의 길이가 다르면 false

  // 배열을 정렬하여 비교
  const sortedArr1 = arr1.sort();
  const sortedArr2 = arr2.sort();

  for (let i = 0; i < sortedArr1.length; i++) {
    if (sortedArr1[i] !== sortedArr2[i]) {
      return false; // 하나라도 다르면 false
    }
  }

  return true; // 모든 요소가 같으면 true
};

// 계층 구조 그루핑하기
export const groupByHierarchical = (data: ILineItem[], keys: LineItemKey[]): GroupedData => {
  const groupByRecursively = (items: ILineItem[], remainingKeys: LineItemKey[]): GroupedData | ILineItem[] => {
    if (remainingKeys.length === 0) {
      return items;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [currentKey, ...nextKeys] = remainingKeys;
    return items.reduce((result, item) => {
      const groupKey = item[currentKey] as unknown as KeyTypeFromItemValue;
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      (result[groupKey] as ILineItem[]).push(item);
      return result;
    }, {} as GroupedData);
  };

  const nestedGroupBy = (groupedData: GroupedData, keys: LineItemKey[]): GroupedData => {
    if (keys.length === 0) return groupedData;
    const [currentKey, ...nextKeys] = keys;
    for (const key in groupedData) {
      if (Array.isArray(groupedData[key])) {
        groupedData[key] = groupByRecursively(groupedData[key] as ILineItem[], [currentKey]);
        nestedGroupBy(groupedData[key] as GroupedData, nextKeys);
      }
    }
    return groupedData;
  };

  const initialGroup = groupByRecursively(data, [keys[0]]);
  return nestedGroupBy(initialGroup as GroupedData, keys.slice(1));
};
