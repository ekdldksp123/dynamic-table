/* eslint-disable @typescript-eslint/no-explicit-any */
import { ILineItemGroup } from '@/types';
import classNames from 'classnames';
import { FC, useRef } from 'react';
import { useDrop, DropTargetMonitor, useDrag, DragSourceMonitor } from 'react-dnd';

interface GroupCardProps {
  id: string;
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

export const GroupCard: FC<GroupCardProps> = ({ id, group, index, onMoveGroup }) => {
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
      key={`group-card-${group.groupId}`}
      className={classNames('px-5 py-1 bg-indigo-200 cursor-pointer opacity-100', isDragging ? '!opacity-50' : '')}
    >
      {group.name}
    </div>
  );
};
