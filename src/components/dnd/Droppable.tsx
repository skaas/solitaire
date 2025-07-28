import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableProps {
  id: string;
  children: (isOver: boolean, ref: (node: HTMLElement | null) => void) => React.ReactElement;
}

export const Droppable = ({ id, children }: DroppableProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return children(isOver, setNodeRef);
};
