import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { useState } from 'react';

import { AmountUnitSelect } from '@/components/ui/amount-unit-select';
import { AMOUNT_UNITS, DEFAULT_AMOUNT_UNIT } from '@/libs/amount-units';

const Harness = () => {
  const [unit, setUnit] = useState(DEFAULT_AMOUNT_UNIT);
  return (
    <>
      <AmountUnitSelect value={unit} onChange={setUnit} />
      <output>{unit}</output>
    </>
  );
};

describe('AmountUnitSelect', () => {
  test('선택 컨트롤을 실제로 그린다', () => {
    render(<AmountUnitSelect value={DEFAULT_AMOUNT_UNIT} onChange={() => {}} />);

    // raw <option> 을 Radix Select 에 넣었을 때는 아무 컨트롤도 그려지지 않았다.
    expect(screen.getByRole('combobox', { name: 'Amount Unit' })).toBeInTheDocument();
  });

  test('현재 단위를 화면에 보여준다', () => {
    render(<AmountUnitSelect value={1_000} onChange={() => {}} />);

    expect(screen.getByRole('combobox', { name: 'Amount Unit' })).toHaveTextContent('1,000');
  });

  test('단위 목록은 10,000 / 1,000 / 1 이고 기본값은 1이다', () => {
    expect(AMOUNT_UNITS.map((unit) => unit.toLocaleString())).toEqual(['10,000', '1,000', '1']);
    expect(DEFAULT_AMOUNT_UNIT).toBe(1);
  });

  test('부모가 넘긴 값이 그대로 반영된다', () => {
    render(<Harness />);

    expect(screen.getByRole('combobox', { name: 'Amount Unit' })).toHaveTextContent('1');
    expect(screen.getByRole('status')).toHaveTextContent('1');
  });
});
