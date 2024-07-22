/* eslint-disable @typescript-eslint/no-explicit-any */
import { ILineItemGroup } from '@/types';
import { FC, useRef } from 'react';
import { useDrop, DropTargetMonitor, useDrag } from 'react-dnd';

interface GroupCardProps {
  group: ILineItemGroup;
  index: number;
  onMoveGroup: (dragIndex: number, hoverIndex: number) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const ItemTypes = {
  CARD: 'card',
};

export const GroupCard: FC<GroupCardProps> = ({ group, index, onMoveGroup }) => {
  const ref = useRef<HTMLLIElement>(null);
  const [, drop] = useDrop({
    accept: ItemTypes.CARD,
    hover(item: unknown, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = (item as DragItem).index;
      console.log('dragIndex', dragIndex, 'hoverIndex', index);
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

  const [{ _isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: {
      type: ItemTypes.CARD,
      id: group.groupId,
      index,
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      key={`group-${group.groupId}`}
      className='px-5 py-1 bg-indigo-200'
      draggable='true'
      data-groupId={group.groupId}
      onDragStart={(event) => {
        event.currentTarget.classList.add('dragging');
        event.dataTransfer.setData('data', group.groupId);
      }}
    >
      {group.name}
    </div>
  );
};
