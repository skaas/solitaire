import React from 'react';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';

interface DndContainerProps {
  children: React.ReactNode;
  onDragEnd: (event: DragEndEvent) => void;
}

export const DndContainer = ({ children, onDragEnd }: DndContainerProps) => {
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      {children}
    </DndContext>
  );
};
