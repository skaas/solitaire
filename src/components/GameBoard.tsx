import { useEffect, useMemo } from 'react';
import { useGameStore } from '../state/GameState';
import { useUIStore } from '../state/UIState';
import { GameService } from '../logic/GameService';
import Column from './Column';
import Card from './Card';
import FortuneOverlay from './fortune/FortuneOverlay';
import { DndContainer } from './dnd/DndContainer';
import type { DragEndEvent } from '@dnd-kit/core';

const GameBoard = () => {
  const {
    score,
    time,
    columns,
    queue,
    deck,
  } = useGameStore();

  const {
    isAnimating,
    isGameOver,
    gameOverReason,
    animationFinished,
    setAnimationFinished,
    fortuneReport,
    queueShake,
  } = useUIStore();

  const showGameOverOverlay = useMemo(
    () => animationFinished && isGameOver,
    [animationFinished, isGameOver],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id === 'draggable-card' && over) {
      const columnId = Number(over.id.toString().replace('column-', ''));
      const cardToMove = queue[queue.length - 1];
      const targetColumn = columns.find(c => c.id === columnId);

      if (cardToMove && targetColumn && useGameStore.getState().canPlaceCard(cardToMove, targetColumn)) {
        GameService.moveCardFromQueue(columnId);
      }
    }
  };
  
  useEffect(() => {
    const timer = setInterval(() => {
      useGameStore.getState().incrementTime();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isGameOver) {
      const timer = setTimeout(() => {
        setAnimationFinished(true);
      }, 1500); // 1.5초 후 애니메이션 종료 상태로 변경
      return () => clearTimeout(timer);
    } else {
      setAnimationFinished(false);
    }
  }, [isGameOver, setAnimationFinished]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <DndContainer onDragEnd={handleDragEnd}>
      <div 
        className="h-dvh bg-gray-900 flex items-center justify-center p-4"
      >
        {/* 9:16 비율 고정 게임 보드 */}
        <div className="w-full max-w-md h-dvh max-h-dvh aspect-[9/16] bg-[#4E1E96] flex flex-col text-white font-sans relative overflow-hidden">
          {isGameOver && !animationFinished && (
            <div className="absolute left-0 right-0 bottom-0 h-full bg-black/90 z-40 animate-fill-up" />
          )}
          {/* Top Bar: Score and Time */}
          <div className="flex justify-between items-center p-4">
            <div className="bg-[#3A166A] p-2 rounded-lg flex items-center">
              <span className="text-yellow-400 text-xl mr-2">🏆</span>
              <span className="text-xl font-bold">{score.toLocaleString()}</span>
            </div>
            {/* Deck Count Display */}
            <div className="bg-[#3A166A] p-2 rounded-lg flex items-center">
              <span className="text-xl mr-2">🃏</span>
              <span className="text-xl font-bold">{deck.length}</span>
            </div>
            <div className="bg-[#3A166A] p-2 rounded-lg flex items-center">
              <span className="text-xl mr-2">🕒</span>
              <span className="text-xl font-bold">{formatTime(time)}</span>
            </div>
          </div>

          {/* Game Area: 4 Columns */}
          <div className="flex-grow grid grid-cols-4 gap-3 px-4 relative">
            {/* 8장 경고선 - 전체 게임 영역에 하나로 통합 */}
            <div 
              className="absolute w-full h-1 bg-red-500 z-20 opacity-80"
              style={{ top: '313px', left: '0', right: '0' }} // 7번째 카드 하단 위치 (6 * 30px + 133px)
            />
            <div 
              className="absolute w-full text-center text-red-400 text-sm font-bold z-20"
              style={{ top: '318px', left: '0', right: '0' }}
            >
              GAME OVER LINE
            </div>
            
            {columns.map((col) => (
              <div key={col.id} className="relative">
                <Column column={col} />
              </div>
            ))}
          </div>

          {/* Bottom Bar: Controls and Queue */}
          <div className="flex items-center justify-center p-4 relative" style={{ height: '120px' }}>
            {/* Center: Card Queue - 겹치게 배치 */}
            <div className={`flex items-center justify-center relative ${queueShake ? 'animate-shake' : ''}`}>
                {queue.map((card, index) => {
                  const totalWidth = 80 + (queue.length - 1) * 25;
                  const startOffset = -totalWidth / 2;
                  const isLastCardInQueue = index === queue.length - 1;

                  return (
                     <div 
                       key={card.id} 
                       className="absolute"
                       style={{
                         left: `${startOffset + index * 25}px`, // 중앙 기준으로 배치
                         zIndex: index + 1 // 오른쪽 카드가 위에 오도록
                       }}
                     >
                        <div className="w-20">
                            <Card 
                              card={card}
                              isDraggable={isLastCardInQueue}
                              isFromQueue={true}
                              isDeadlockQueueCard={isLastCardInQueue && gameOverReason === 'deadlock'}
                            />
                        </div>
                     </div>
                  );
                })}
            </div>
          </div>

          {/* Game Over Overlay */}
          {showGameOverOverlay && fortuneReport && (
            <FortuneOverlay
              score={score}
              report={fortuneReport}
              onRestart={GameService.resetGame}
            />
          )}
        </div>
      </div>
    </DndContainer>
  );
};

export default GameBoard;
