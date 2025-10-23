import type { Card as CardType } from '../types';
import { useUIStore } from '../state/UIState';
import { Draggable } from './dnd/Draggable';
import type { CSSProperties } from 'react';
import clsx from 'clsx';

interface CardProps {
  card: CardType;
  isDraggable?: boolean;
  isFromQueue?: boolean;
  isGameOverCard?: boolean;
  isDeadlockQueueCard?: boolean;
  isDeadlockColumnCard?: boolean;
}

const Card = ({ card, isDraggable = false, isFromQueue = false, isGameOverCard = false, isDeadlockQueueCard = false, isDeadlockColumnCard = false }: CardProps) => {
  const animatingCards = useUIStore((state) => state.animatingCards);
  const isAnimating = animatingCards.includes(card.id);

  const cardContent = (isDragging: boolean, style: CSSProperties, ref: any, attributes: any, listeners: any) => (
    <div
      ref={ref}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'fortune-card w-full aspect-[5/7] rounded-lg flex flex-col items-start justify-between p-2 text-white text-2xl font-bold shadow-md border-b-4 border-black/20 transition-all duration-0',
        card.color,
        {
          'cursor-grab active:cursor-grabbing hover:scale-105': isDraggable && isFromQueue,
          'cursor-default': !(isDraggable && isFromQueue),
          'animate-pulse scale-110 ring-4 ring-yellow-400 ring-opacity-75': isAnimating,
          'opacity-50': isDragging,
          'animate-shake': isGameOverCard,
          'scale-110 fill-black-setup animate-fill-black': isDeadlockQueueCard,
          'scale-110 animate-shake': isDeadlockColumnCard,
        },
      )}
    >
      <div className="text-base flex items-center">
        <span>{card.suitEmoji}</span>
        <span className="ml-1 text-sm font-semibold">{card.suitLabel}</span>
      </div>
      <div className="self-center text-3xl">{card.value}</div>
      <div className="text-xs self-end opacity-80">{card.tier === 3 ? '대운' : `${card.tier}단계`}</div>
    </div>
  );

  return (
    <Draggable id={isDraggable ? 'draggable-card' : card.id.toString()} disabled={!isDraggable}>
      {(isDragging, style, ref, attributes, listeners) => cardContent(isDragging, style, ref, attributes, listeners)}
    </Draggable>
  );
};

export default Card;
