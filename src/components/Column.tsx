import type { Column as ColumnType } from '../types';
import Card from './Card';
import { useGameStore } from '../state/GameState';
import { canPlaceCard } from '../logic/GameLogic';
import { Droppable } from './dnd/Droppable';

interface ColumnProps {
  column: ColumnType;
}

const Column = ({ column }: ColumnProps) => {
  const { queue } = useGameStore();

  const cardToMove = queue.length > 0 ? queue[queue.length - 1] : null;

  const columnContent = (isOver: boolean, ref: any) => {
    const isValidDrop = isOver && cardToMove && canPlaceCard(cardToMove, column);
    
    const getDropZoneStyle = () => {
      const baseStyle = 'w-full h-full relative rounded-lg transition-all duration-200';
      if (isOver) {
        return isValidDrop
          ? `${baseStyle} border-2 border-green-400 bg-green-50/10`
          : `${baseStyle} border-2 border-red-400 bg-red-50/10`;
      }
      return `${baseStyle} border border-transparent hover:border-white/30`;
    };

    return (
      <div
        ref={ref}
        className={getDropZoneStyle()}
        style={{ minHeight: '400px' }}
      >
        {column.cards.map((card, index) => (
          <div
            key={card.id}
            className="absolute w-full"
            style={{ top: index * 30 }}
          >
            <Card
              card={card}
              isDraggable={false}
              isFromQueue={false}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Droppable id={`column-${column.id}`}>
      {(isOver, ref) => columnContent(isOver, ref)}
    </Droppable>
  );
};

export default Column;
