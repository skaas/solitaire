import type { Card as CardType } from '../types';
import { useGameStore } from '../state/GameState';

interface CardProps {
  card: CardType;
  isDraggable?: boolean;
  isFromQueue?: boolean;
}

const Card = ({ card, isDraggable = false, isFromQueue = false }: CardProps) => {
  const animatingCards = useGameStore((state) => state.animatingCards);
  const isAnimating = animatingCards.includes(card.id);

  const handleDragStart = (e: React.DragEvent) => {
    // 컬럼에 있는 카드는 드래그 불가능 (큐에서만 가능)
    if (!isDraggable || !isFromQueue) {
      e.preventDefault();
      return;
    }
    
    // 큐에서 오는 카드만 드래그 데이터 설정
    const dragData = { fromQueue: true };
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={`w-full aspect-[5/7] ${card.color} rounded-lg flex items-start justify-start p-2 text-white text-2xl font-bold shadow-md border-b-4 border-black/20 transition-all duration-300 ${
        isDraggable && isFromQueue ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-default'
      } ${
        isAnimating ? 'animate-pulse scale-110 ring-4 ring-yellow-400 ring-opacity-75' : ''
      }`}
      draggable={isDraggable && isFromQueue}
      onDragStart={handleDragStart}
    >
      {card.value}
    </div>
  );
};

export default Card;
