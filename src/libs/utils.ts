/* eslint-disable @typescript-eslint/no-unused-vars */
import { GroupItemValue, GroupedData, ILineItem } from '@/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const groupByHierarchical = (data: ILineItem[], keys: (keyof ILineItem)[]): GroupedData => {
  const groupByRecursively = (items: ILineItem[], remainingKeys: (keyof ILineItem)[]): GroupedData | ILineItem[] => {
    if (remainingKeys.length === 0) {
      return items;
    }
    const [currentKey, ...nextKeys] = remainingKeys;
    return items.reduce((result, item) => {
      const groupKey = item[currentKey] as unknown as Exclude<GroupItemValue, boolean | null | string[]>;
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      (result[groupKey] as ILineItem[]).push(item);
      return result;
    }, {} as GroupedData);
  };

  const nestedGroupBy = (groupedData: GroupedData, keys: (keyof ILineItem)[]): GroupedData => {
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
