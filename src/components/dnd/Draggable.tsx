import React from 'react';
import type { CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';

interface DraggableProps {
  id: string;
  children: (isDragging: boolean, style: CSSProperties, ref: (node: HTMLElement | null) => void, attributes: any, listeners: any) => React.ReactElement;
  disabled?: boolean;
}

export const Draggable = ({ id, children, disabled = false }: DraggableProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled,
  });

  const style: CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 100 : undefined,
        touchAction: 'none',
      }
    : {
        touchAction: 'none',
      };

  return children(isDragging, style, setNodeRef, attributes, listeners);
};
