import { useState } from 'react';
import type { Column as ColumnType } from '../types';
import { useGameStore } from '../state/GameState';
import { canPlaceCard } from '../logic/GameLogic';
import Card from './Card';

interface ColumnProps {
  column: ColumnType;
}

const Column = ({ column }: ColumnProps) => {
  const { moveCardFromQueue, queue } = useGameStore();
  const [dragOverState, setDragOverState] = useState<'none' | 'valid' | 'invalid'>('none');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // 드래그 중인 카드 정보 가져오기
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      // 큐에서 오는 카드만 처리
      if (dragData.fromQueue && queue.length > 0) {
        const cardToCheck = queue[queue.length - 1];
        const canPlace = canPlaceCard(cardToCheck, column);
        setDragOverState(canPlace ? 'valid' : 'invalid');
      } else {
        setDragOverState('none');
      }
    } catch (error) {
      setDragOverState('none');
    }
  };

  const handleDragLeave = () => {
    setDragOverState('none');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverState('none');
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      // 큐에서 오는 카드만 처리
      if (dragData.fromQueue) {
        moveCardFromQueue(column.id);
      }
    } catch (error) {
      console.error('드롭 데이터 파싱 오류:', error);
    }
  };

  // 드래그 오버 상태에 따른 스타일 클래스
  const getDropZoneStyle = () => {
    const baseStyle = 'w-full h-full relative rounded-lg transition-all duration-200';
    switch (dragOverState) {
      case 'valid':
        return `${baseStyle} border-2 border-green-400 bg-green-50/10`;
      case 'invalid':
        return `${baseStyle} border-2 border-red-400 bg-red-50/10`;
      default:
        return `${baseStyle} border border-transparent hover:border-white/30`;
    }
  };

  return (
    <div
      className={getDropZoneStyle()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ minHeight: '400px' }} // 충분한 높이 확보
    >
      {column.cards.map((card, index) => {
        return (
          <div
            key={card.id}
            className="absolute w-full"
            style={{ top: index * 30 }}
          >
            <Card
              card={card}
              isDraggable={false} // 컬럼의 카드는 더 이상 드래그 불가능
              columnId={column.id}
            />
          </div>
        );
      })}
    </div>
  );
};

export default Column;
