import { useDraggable } from '@dnd-kit/core';
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

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: isDraggable ? 'draggable-card' : card.id,
    disabled: !isDraggable,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, touchAction: 'none' }}
      {...listeners}
      {...attributes}
      className={`w-full aspect-[5/7] ${card.color} rounded-lg flex items-start justify-start p-2 text-white text-2xl font-bold shadow-md border-b-4 border-black/20 transition-all duration-0 ${
        isDraggable && isFromQueue ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-default'
      } ${
        isAnimating ? 'animate-pulse scale-110 ring-4 ring-yellow-400 ring-opacity-75' : ''
      }`}
    >
      {card.value}
    </div>
  );
};

export default Card;
