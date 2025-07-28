import React, { useEffect } from 'react';
import { useGameStore } from '../state/GameState';
import Column from './Column';
import Card from './Card';
import { DndContainer } from './dnd/DndContainer';
import type { DragEndEvent } from '@dnd-kit/core';

const GameBoard = () => {
  const { 
    score, time, columns, queue, deck, 
    undoCount, trashCount, isGameOver, 
    resetGame, undo, trashCard,
    moveCardFromQueue,
  } = useGameStore();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id === 'draggable-card' && over) {
      const columnId = Number(over.id.toString().replace('column-', ''));
      const cardToMove = queue[queue.length - 1];
      const targetColumn = columns.find(c => c.id === columnId);

      if (cardToMove && targetColumn && useGameStore.getState().canPlaceCard(cardToMove, targetColumn)) {
        moveCardFromQueue(columnId);
      }
    }
  };
  
  useEffect(() => {
    const timer = setInterval(() => {
      useGameStore.setState((state) => ({ time: state.time + 1 }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <DndContainer onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        {/* 9:16 비율 고정 게임 보드 */}
        <div className="w-full max-w-md h-screen max-h-screen aspect-[9/16] bg-[#4E1E96] flex flex-col text-white font-sans relative">
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
          <div className="flex items-center justify-between p-4 relative" style={{ height: '120px' }}>
            {/* Left Controls: Undo */}
            <div className="flex flex-col gap-1 z-10">
                <button 
                  onClick={undo}
                  disabled={undoCount === 0 || isGameOver}
                  className="bg-[#3A166A] p-2 rounded-lg flex items-center justify-between transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" 
                  style={{ width: '60px', height: '40px' }}
                >
                    <span className="text-sm">↩️</span>
                    <span className="text-xs font-bold">{undoCount}</span>
                </button>
                 <div className="bg-[#3A166A] p-2 rounded-lg flex items-center justify-between opacity-50" style={{ width: '60px', height: '40px' }}>
                    <span className="text-sm">↪️</span>
                    <span className="text-xs font-bold">0</span>
                </div>
            </div>
            
            {/* Center: Card Queue - 겹치게 배치 */}
            <div className="flex items-center justify-center relative">
                {queue.map((card, index) => {
                  // 전체 카드 그룹의 너비 계산: 첫 카드 너비 + (카드 수 - 1) * 겹침 간격
                  const totalWidth = 80 + (queue.length - 1) * 25; // 카드 너비 80px + 겹침 25px
                  const startOffset = -totalWidth / 2; // 중앙 기준점에서 왼쪽으로 절반만큼 이동
                  
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
                              isDraggable={index === queue.length - 1} // 마지막(오른쪽) 카드만 드래그 가능
                              isFromQueue={true}
                            />
                        </div>
                     </div>
                  );
                })}
            </div>

            {/* Right Controls: Trash */}
            <div className="flex items-center z-10">
                <button
                  onClick={trashCard}
                  disabled={trashCount === 0 || queue.length === 0 || isGameOver}
                  className="bg-[#3A166A] p-2 rounded-lg flex flex-col items-center justify-center transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" 
                  style={{ width: '60px', height: '80px' }}
                >
                     <span className="text-2xl">🗑️</span>
                     <span className="text-xs font-bold">{trashCount}</span>
                </button>
            </div>
          </div>

          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="bg-[#3A166A] p-6 rounded-lg text-center">
                <h2 className="text-2xl font-bold text-red-400 mb-4">GAME OVER</h2>
                {deck.length === 0 && queue.length === 0 ? (
                  <p className="text-white mb-4">덱의 모든 카드를 사용했습니다!</p>
                ) : (
                  <p className="text-white mb-4">한 줄에 8장 이상 쌓였습니다!</p>
                )}
                <p className="text-yellow-400 mb-6">최종 점수: {score.toLocaleString()}</p>
                <button 
                  onClick={resetGame}
                  className="bg-[#4E1E96] hover:bg-[#5E2EA6] px-6 py-2 rounded-lg font-bold transition-colors"
                >
                  다시 시작
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndContainer>
  );
};

export default GameBoard;
