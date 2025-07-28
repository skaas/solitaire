import type { Card as CardType } from '../types';
import { useGameStore } from '../state/GameState';
import { Draggable } from './dnd/Draggable';
import type { CSSProperties } from 'react';

interface CardProps {
  card: CardType;
  isDraggable?: boolean;
  isFromQueue?: boolean;
}

const Card = ({ card, isDraggable = false, isFromQueue = false }: CardProps) => {
  const animatingCards = useGameStore((state) => state.animatingCards);
  const isAnimating = animatingCards.includes(card.id);

  const cardContent = (isDragging: boolean, style: CSSProperties, ref: any, attributes: any, listeners: any) => (
    <div
      ref={ref}
      style={style}
      {...attributes}
      {...listeners}
      className={`w-full aspect-[5/7] ${card.color} rounded-lg flex items-start justify-start p-2 text-white text-2xl font-bold shadow-md border-b-4 border-black/20 transition-all duration-0 ${
        isDraggable && isFromQueue ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-default'
      } ${
        isAnimating ? 'animate-pulse scale-110 ring-4 ring-yellow-400 ring-opacity-75' : ''
      } ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {card.value}
    </div>
  );

  return (
    <Draggable id={isDraggable ? 'draggable-card' : card.id.toString()} disabled={!isDraggable}>
      {(isDragging, style, ref, attributes, listeners) => cardContent(isDragging, style, ref, attributes, listeners)}
    </Draggable>
  );
};

export default Card;
