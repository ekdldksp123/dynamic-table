import { CheckedState } from '@radix-ui/react-checkbox';
import { Dispatch, FC, ReactNode, SetStateAction, useCallback } from 'react';

import { CheckboxGroup } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GroupType, ILineItemGroup } from '@/types/create-table.v2';

const GROUP_TYPE_BY_TITLE: Record<string, GroupType> = {
  Row: 'row',
  Column: 'column',
  Value: 'value',
};

const SELECT_PLACEHOLDER: Record<GroupType, string> = {
  row: '행을 선택하세요',
  column: '열을 선택하세요',
  value: '값을 선택하세요',
};

interface DraggableCardListProps {
  title: string;
  children: ReactNode;
  groups: ILineItemGroup[];
  setGroups: Dispatch<SetStateAction<ILineItemGroup[]>>;
  showTotal?: CheckedState;
  onChangeShowTotal?: (showTotal: CheckedState) => void;
}

/**
 * 하나의 축(행/열/값)에 배치된 그룹 카드 목록.
 *
 * 카드끼리의 순서 변경은 각 `GroupCard`가 react-dnd 로 처리하므로, 이 목록을
 * 쓰는 쪽에서 하나의 `DndProvider` 안에 넣어주어야 한다.
 */
export const DraggableCardList: FC<DraggableCardListProps> = ({
  title,
  children,
  groups,
  setGroups,
  showTotal,
  onChangeShowTotal,
}) => {
  const groupType = GROUP_TYPE_BY_TITLE[title];

  const onSelectGroup = useCallback(
    (id: string) => {
      setGroups((prev) => prev.map((group) => (group.id === id ? { ...group, type: groupType } : group)));
    },
    [groupType, setGroups],
  );

  return (
    <div className='p-3 border rounded'>
      <div className='mb-3 w-[100%] relative flex items-center'>
        <p className='text-lg font-bold text-center'>{title}</p>
        <div className='absolute right-0 flex items-center gap-2'>
          <Select onValueChange={onSelectGroup}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder={SELECT_PLACEHOLDER[groupType]} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Group</SelectLabel>
                {groups.map((group) => (
                  <SelectItem key={`select-${title}-${group.id}`} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      {onChangeShowTotal ? (
        <CheckboxGroup
          id={`show-total-${groupType}`}
          label='Show Total'
          checked={showTotal}
          onCheckedChange={onChangeShowTotal}
        />
      ) : null}
      <div className='flex flex-col gap-3'>{children}</div>
    </div>
  );
};
