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
    useSensor(TouchSensor, {
      // 100ms의 누르기 지연과 5px의 이동 허용 오차를 설정합니다.
      // 이렇게 하면 사용자가 0.1초 이상 누르거나 5px 이상 움직여야 드래그가 시작됩니다.
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  );

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      {children}
    </DndContext>
  );
};
