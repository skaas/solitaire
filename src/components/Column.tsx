import { useDroppable } from '@dnd-kit/core';
import type { Column as ColumnType } from '../types';
import Card from './Card';
import { useGameStore } from '../state/GameState';
import { canPlaceCard } from '../logic/GameLogic';

interface ColumnProps {
  column: ColumnType;
}

const Column = ({ column }: ColumnProps) => {
  const { queue } = useGameStore();
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${column.id}`,
  });

  const cardToMove = queue[queue.length - 1];
  const isValidDrop = isOver && cardToMove && canPlaceCard(cardToMove, column);

  const getDropZoneStyle = () => {
    const baseStyle = 'w-full h-full relative rounded-lg transition-all duration-200';
    if (isOver) {
      if(isValidDrop) {
        return `${baseStyle} border-2 border-green-400 bg-green-50/10`;
      }
      return `${baseStyle} border-2 border-red-400 bg-red-50/10`;
    }
    return `${baseStyle} border border-transparent hover:border-white/30`;
  };

  return (
    <div
      ref={setNodeRef}
      className={getDropZoneStyle()}
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
            />
          </div>
        );
      })}
    </div>
  );
};

export default Column;
