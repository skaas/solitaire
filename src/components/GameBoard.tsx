import { useEffect, useMemo } from 'react';
import { useGameStore } from '../state/GameState';
import { useUIStore } from '../state/UIState';
import { GameService } from '../logic/GameService';
import Column from './Column';
import Card from './Card';
import FortuneOverlay from './fortune/FortuneOverlay';
import { DndContainer } from './dnd/DndContainer';
import type { DragEndEvent } from '@dnd-kit/core';

interface GameBoardProps {
  userInfo: { name: string; birthdate: string };
  onRestart: () => void;
}

const GameBoard = ({ userInfo, onRestart }: GameBoardProps) => {
  const {
    score,
    time,
    columns,
    queue,
    deck,
  } = useGameStore();

  const {
    isGameOver,
    gameOverReason,
    animationFinished,
    setAnimationFinished,
    fortuneReport,
    queueShake,
    fortuneMessage,
  } = useUIStore();

  const showGameOverOverlay = useMemo(
    () => animationFinished && isGameOver,
    [animationFinished, isGameOver],
  );

  // userInfo로부터 salt 생성 (이름-YYYY-MM-DD 형식)
  const salt = useMemo(() => {
    const date = new Date(userInfo.birthdate);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${userInfo.name}-${year}-${month}-${day}`;
  }, [userInfo]);

  // 컴포넌트 마운트 시 salt로 게임 초기화
  useEffect(() => {
    useGameStore.getState().resetState(salt);
    useUIStore.getState().resetGameOver();
    useUIStore.getState().clearAnimatingCards();
    useUIStore.getState().setAnimating(false);
  }, [salt]);

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
          <div className="flex-grow grid grid-cols-4 gap-3 px-3 pt-2 pb-8 relative">
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
          <div className="px-4 pb-8">
            <div className="flex flex-col gap-6">
              <div className="relative flex justify-center h-[110px]">
                <div className={`flex items-end justify-center relative ${queueShake ? 'animate-shake' : ''}`}>
                  {queue.map((card, index) => {
                    const offset = (index - (queue.length - 1) / 2) * 25;
                    const isLastCardInQueue = index === queue.length - 1;

                    return (
                      <div
                        key={card.id}
                        className="absolute bottom-0"
                        style={{ transform: `translateX(${offset}px)` }}
                      >
                        <div className="w-20">
                          <Card
                            card={card}
                            isDraggable={isLastCardInQueue}
                            isFromQueue
                            isDeadlockQueueCard={isLastCardInQueue && gameOverReason === 'deadlock'}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-black/40 rounded-xl border border-white/10 px-4 py-3 min-h-[96px]">
                {fortuneMessage.length > 0 ? (
                  <div className="space-y-1 text-sm leading-relaxed">
                    {fortuneMessage.slice(0, 5).map((line, idx) => (
                      <p key={idx} className="text-white/85">{line}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/50 text-sm">아직 운의 메시지가 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          {/* Game Over Overlay */}
          {showGameOverOverlay && fortuneReport && (
            <FortuneOverlay
              score={score}
              report={fortuneReport}
              onRestart={onRestart}
            />
          )}
        </div>
      </div>
    </DndContainer>
  );
};

export default GameBoard;
