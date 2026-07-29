import { FC } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AMOUNT_UNITS } from '@/libs/amount-units';

interface AmountUnitSelectProps {
  value: number;
  onChange: (unit: number) => void;
}

/**
 * 금액 단위 선택.
 *
 * Radix `Select` 는 `<option>` 자식을 렌더하지 않으므로
 * Trigger/Value/Content/Item 조합이 반드시 필요하다.
 */
export const AmountUnitSelect: FC<AmountUnitSelectProps> = ({ value, onChange }) => (
  <Select value={String(value)} onValueChange={(unit) => onChange(Number(unit))}>
    <SelectTrigger className='w-[120px]' aria-label='Amount Unit'>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {AMOUNT_UNITS.map((unit) => (
        <SelectItem key={unit} value={String(unit)}>
          {unit.toLocaleString()}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
