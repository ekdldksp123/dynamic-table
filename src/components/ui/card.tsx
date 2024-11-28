/* eslint-disable @typescript-eslint/no-explicit-any */
import classNames from 'classnames';
import { FC, useRef } from 'react';
import { useDrop, DropTargetMonitor, useDrag, DragSourceMonitor } from 'react-dnd';
import { CheckboxGroup } from '@/components/ui/checkbox';
import { CheckedState } from '@radix-ui/react-checkbox';
import { CiSquareRemove } from 'react-icons/ci';
import { GroupType, ILineItemGroup } from '@/types/create-table.v2';
interface GroupCardProps {
  id: string;
  group: ILineItemGroup;
  index: number;
  type: GroupType;
  onMoveGroup: (dragIndex: number, hoverIndex: number) => void;
  onRemoveGroup: (id: string, type: GroupType) => void;
  onChangeShowTotal?: (index: number, showTotal: CheckedState) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const ItemTypes = {
  CARD: 'card',
};

export const GroupCard: FC<GroupCardProps> = ({
  id,
  group,
  index,
  type,
  onMoveGroup,
  onRemoveGroup,
  onChangeShowTotal,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.CARD,
    hover(item: unknown, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = (item as DragItem).index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      const clientOffset = monitor.getClientOffset();

      if (clientOffset) {
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;

        // Dragging downwards
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }

        // Dragging upwards
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }
      }
      onMoveGroup(dragIndex, hoverIndex);

      (item as DragItem).index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: {
      type: ItemTypes.CARD,
      id,
      index,
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      key={`group-card-${group.id}`}
      className={classNames(
        'relative flex w-[100%] px-5 py-3 bg-indigo-200 cursor-move opacity-100',
        isDragging ? '!opacity-50' : '',
      )}
    >
      <div>
        {group.name}
        {onChangeShowTotal ? (
          <CheckboxGroup
            id={group.id}
            label='Show Subtotal'
            checked={group.showTotal}
            onCheckedChange={(v) => onChangeShowTotal(index, v)}
          />
        ) : null}
      </div>
      <CiSquareRemove
        className='absolute right-3 w-[20px] h-[20px] cursor-pointer'
        onClick={() => onRemoveGroup(group.id, type)}
      />
    </div>
  );
};
