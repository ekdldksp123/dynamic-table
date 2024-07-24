import { GroupedData } from '@/types';
import { useCreateTable } from '../libs/hooks/useCreateTable';

const groupedDataWithDuplicatedName: GroupedData = {
  매매목적: {
    부채: [
      { code: '205170700', name: '통화스왑_매매', base: ['1'], isCustom: false, value: 2 },
      { code: '205170500', name: '통화선도_매매', base: ['1'], isCustom: false, value: 5 },
      { code: '205170300', name: '이자율스왑_매매', base: ['1'], isCustom: false, value: 78 },
      { code: '205170100', name: '이자율선도_매매', base: ['1'], isCustom: false, value: 3 },
    ],
    자산: [
      { code: '112130700', name: '통화스왑_매매', base: ['1'], isCustom: false, value: 1 },
      { code: '112130500', name: '통화선도_매매', base: ['1'], isCustom: false, value: 4 },
      { code: '112130300', name: '이자율스왑_매매', base: ['1'], isCustom: false, value: 7 },
      { code: '112130100', name: '이자율선도_매매', base: ['1'], isCustom: false, value: 23 },
    ],
  },
  위험회피목적: {
    부채: [
      { code: '205172000', name: '통화스왑_헤지', base: ['1'], isCustom: false, value: 43 },
      { code: '205171800', name: '통화선도_헤지', base: ['1'], isCustom: false, value: 6 },
      { code: '205171600', name: '이자율스왑_헤지', base: ['1'], isCustom: false, value: 1 },
      { code: '205171400', name: '이자율선도_헤지', base: ['1'], isCustom: false, value: 213 },
    ],
    자산: [
      { code: '112132000', name: '통화스왑_헤지', base: ['1'], isCustom: false, value: 3 },
      { code: '112131800', name: '통화선도_헤지', base: ['1'], isCustom: false, value: 6 },
      { code: '112131600', name: '이자율스왑_헤지', base: ['1'], isCustom: false, value: 1 },
      { code: '112131400', name: '이자율선도_헤지', base: ['1'], isCustom: false, value: 21 },
    ],
  },
};

const groupedDataWithDuplicatedNameExpectedSubtotals = {
  자산: [{ subtotal: 4 }, { subtotal: 10 }, { subtotal: 8 }, { subtotal: 44 }],
  부채: [{ subtotal: 45 }, { subtotal: 11 }, { subtotal: 79 }, { subtotal: 216 }],
};

export const groupedDataWithNoDuplicatedName: GroupedData = {
  매매목적: {
    부채1: [
      { code: '205170700', name: '통화스왑_매매', base: ['1'], isCustom: false, value: 2 },
      { code: '205170500', name: '통화선도_매매', base: ['1'], isCustom: false, value: 5 },
      { code: '205170300', name: '이자율스왑_매매', base: ['1'], isCustom: false, value: 78 },
      { code: '205170100', name: '이자율선도_매매', base: ['1'], isCustom: false, value: 3 },
    ],
    자산2: [
      { code: '112130700', name: '통화스왑_매매', base: ['1'], isCustom: false, value: 1 },
      { code: '112130500', name: '통화선도_매매', base: ['1'], isCustom: false, value: 4 },
      { code: '112130300', name: '이자율스왑_매매', base: ['1'], isCustom: false, value: 7 },
      { code: '112130100', name: '이자율선도_매매', base: ['1'], isCustom: false, value: 23 },
    ],
  },
  위험회피목적: {
    부채3: [
      { code: '205172000', name: '통화스왑_헤지', base: ['1'], isCustom: false, value: 43 },
      { code: '205171800', name: '통화선도_헤지', base: ['1'], isCustom: false, value: 6 },
      { code: '205171600', name: '이자율스왑_헤지', base: ['1'], isCustom: false, value: 1 },
      { code: '205171400', name: '이자율선도_헤지', base: ['1'], isCustom: false, value: 213 },
    ],
    자산4: [
      { code: '112132000', name: '통화스왑_헤지', base: ['1'], isCustom: false, value: 3 },
      { code: '112131800', name: '통화선도_헤지', base: ['1'], isCustom: false, value: 6 },
      { code: '112131600', name: '이자율스왑_헤지', base: ['1'], isCustom: false, value: 1 },
      { code: '112131400', name: '이자율선도_헤지', base: ['1'], isCustom: false, value: 21 },
    ],
  },
};

const groupedDataWithNoDuplicatedNameExpectedSubtotals = {
  자산2: [{ subtotal: 1 }, { subtotal: 4 }, { subtotal: 7 }, { subtotal: 23 }],
  자산4: [{ subtotal: 3 }, { subtotal: 6 }, { subtotal: 1 }, { subtotal: 21 }],
  부채1: [{ subtotal: 2 }, { subtotal: 5 }, { subtotal: 78 }, { subtotal: 3 }],
  부채3: [{ subtotal: 43 }, { subtotal: 6 }, { subtotal: 1 }, { subtotal: 213 }],
};
describe('열 그룹 소계 테스트', () => {
  const { calculateSubtotals } = useCreateTable();
  test('중복된 이름이 있는 그룹 소계 테스트', () => {
    return expect(calculateSubtotals(groupedDataWithDuplicatedName)).toStrictEqual(
      groupedDataWithDuplicatedNameExpectedSubtotals,
    );
  });

  test('중복된 이름이 없는 그룹 소계 테스트', () => {
    return expect(calculateSubtotals(groupedDataWithNoDuplicatedName)).toStrictEqual(
      groupedDataWithNoDuplicatedNameExpectedSubtotals,
    );
  });
});
