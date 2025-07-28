import { create } from 'zustand';
import type { Card, Column } from '../types';
import { processChainMerge, createFiniteDeck, shuffleDeck, canPlaceCard, processAllMerges, getColorForValue } from '../logic/GameLogic';

// GameState의 스냅샷 타입
type GameStateSnapshot = {
  columns: Column[];
  queue: Card[];
  deck: Card[];
  score: number;
};

// GameState 인터페이스 업데이트
interface GameState {
  score: number;
  time: number;
  columns: Column[];
  queue: Card[];
  deck: Card[];
  history: GameStateSnapshot[]; // 이전 상태 저장
  undoCount: number;
  trashCount: number;
  isAnimating: boolean;
  animatingCards: number[];
  isGameOver: boolean;
  canPlaceCard: (card: Card, column: Column) => boolean;
  setColumns: (columns: Column[]) => void;
  setQueue: (queue: Card[]) => void;
  moveCardFromQueue: (toColumnId: number) => void;
  addScore: (points: number) => void;
  setAnimating: (isAnimating: boolean) => void;
  setAnimatingCards: (cardIds: number[]) => void;
  processMergeWithAnimation: (columnId: number) => void;
  checkGameOver: () => boolean;
  resetGame: () => void;
  undo: () => void; // 되돌리기
  trashCard: () => void; // 카드 버리기
}

// 게임 초기화 함수
const initializeGame = () => {
  const newDeck = shuffleDeck(createFiniteDeck());
  let initialScore = 0;

  const initialColumns: Column[] = [{ id: 1, cards: [] }, { id: 2, cards: [] }, { id: 3, cards: [] }, { id: 4, cards: [] }];
  
  // 각 컬럼에 2장씩 카드 분배
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 4; j++) {
      const card = newDeck.pop();
      if (card) {
        initialColumns[j].cards.push(card);
      }
    }
  }

  // 각 컬럼 카드를 내림차순으로 정렬 후, 자동 병합
  initialColumns.forEach((col, index) => {
    col.cards.sort((a, b) => b.value - a.value);
    
    // 자동 병합 처리
    const { mergedColumn, scoreGained } = processAllMerges(col);
    initialColumns[index] = mergedColumn;
    initialScore += scoreGained;
  });

  // 큐에 '2' 카드 3장 배치
  const initialQueue: Card[] = [
    { id: Math.random(), value: 2, color: getColorForValue(2) },
    { id: Math.random(), value: 2, color: getColorForValue(2) },
    { id: Math.random(), value: 2, color: getColorForValue(2) },
  ];

  // 덱에서 '2' 카드 3장 제거
  for (let i = 0; i < 3; i++) {
    const cardIndex = newDeck.findIndex(card => card.value === 2);
    if (cardIndex !== -1) {
      newDeck.splice(cardIndex, 1);
    }
  }

  return {
    columns: initialColumns,
    queue: initialQueue,
    deck: newDeck,
    score: initialScore, // 초기 점수 반영
    time: 0,
    history: [],
    undoCount: 2,
    trashCount: 1,
    isAnimating: false,
    animatingCards: [],
    isGameOver: false,
  };
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initializeGame(),

  canPlaceCard: (card: Card, column: Column): boolean => {
    if (column.cards.length === 0) {
      return true;
    }
    const topCard = column.cards[column.cards.length - 1];
    return card.value <= topCard.value;
  },

  setColumns: (columns) => set({ columns }),
  setQueue: (queue) => set({ queue }),
  
  // moveCard는 더 이상 사용하지 않음
  moveCard: () => {},

  moveCardFromQueue: (toColumnId) => {
    const state = get();
    if (state.isAnimating || state.isGameOver) return;
    if (state.queue.length === 0) return;

    const toColumn = state.columns.find(col => col.id === toColumnId);
    const cardToMove = state.queue[state.queue.length - 1]; // 오른쪽 카드

    if (toColumn && cardToMove) {
      if (!canPlaceCard(cardToMove, toColumn) || toColumn.cards.length >= 8) {
        if (toColumn.cards.length >= 8) {
          set({ isGameOver: true });
        }
        return;
      }
      
      const newQueue = state.queue.slice(0, -1);
      const newDeck = [...state.deck];

      // 덱에서 카드 하나 뽑아 큐에 추가
      const nextCard = newDeck.pop();
      if (nextCard) {
        newQueue.unshift(nextCard); // 왼쪽에 추가
      }

      const newColumns = state.columns.map(col =>
        col.id === toColumnId
          ? { ...col, cards: [...col.cards, cardToMove] }
          : col
      );
      
      // 상태 변경 전, 현재 상태를 history에 저장
      const currentState = get();
      const newHistory = [
        {
          columns: currentState.columns,
          queue: currentState.queue,
          deck: currentState.deck,
          score: currentState.score,
        },
        ...currentState.history,
      ].slice(0, 2); // 최대 2개까지 저장

      set({
        columns: newColumns,
        queue: newQueue,
        deck: newDeck,
        history: newHistory, // history 업데이트
      });

      if (get().checkGameOver()) {
        set({ isGameOver: true });
      } else {
        setTimeout(() => get().processMergeWithAnimation(toColumnId), 100);
      }
    }
  },

  undo: () => {
    const { history, undoCount } = get();
    if (undoCount > 0 && history.length > 0) {
      const lastState = history[0];
      set({
        ...lastState,
        history: history.slice(1), // 사용한 history 제거
        undoCount: undoCount - 1,
      });
    }
  },

  trashCard: () => {
    const { queue, deck, trashCount } = get();
    if (trashCount > 0 && queue.length > 0) {
      const newQueue = queue.slice(0, -1); // 맨 오른쪽 카드 제거
      const newDeck = [...deck];

      const nextCard = newDeck.pop();
      if (nextCard) {
        newQueue.unshift(nextCard); // 왼쪽에 새 카드 추가
      }

      set({
        queue: newQueue,
        deck: newDeck,
        trashCount: trashCount - 1,
      });
    }
  },

  checkGameOver: () => {
    const { columns, deck, queue, trashCount, canPlaceCard } = get();
    
    // 기존 조건 1: 8장 이상 쌓인 컬럼이 있을 때
    if (columns.some(col => col.cards.length >= 8)) {
      return true;
    }
    
    // 기존 조건 2: 덱과 큐가 모두 비었을 때
    if (deck.length === 0 && queue.length === 0) {
      return true;
    }

    // 새로운 조건 추가
    if (queue.length > 0) {
     const cardToMove = queue[queue.length - 1];
     const noValidMoves = columns.every(col => !canPlaceCard(cardToMove, col));

     // 조건 1: 현재 카드를 놓을 곳이 없고,
     if (noValidMoves) {
       // 조건 2: 휴지통도 더 쓸 수 없을 때 (교착 상태)
       if (trashCount === 0) {
         return true;
       }
     }
   }

    return false;
  },

  resetGame: () => {
    set(initializeGame());
  },

  // ... 나머지 함수들 (processMergeWithAnimation, addScore 등)
  addScore: (points) => set((state) => ({ score: state.score + points })),
  setAnimating: (isAnimating) => set({ isAnimating }),
  setAnimatingCards: (cardIds) => set({ animatingCards: cardIds }),
  processMergeWithAnimation: (columnId: number) => {
    const state = get();
    const column = state.columns.find(col => col.id === columnId);
    if (!column) return;
    
    const mergingCardIds: number[] = [];
    for (let i = 0; i < column.cards.length - 1; i++) {
      if (column.cards[i].value === column.cards[i + 1].value) {
        mergingCardIds.push(column.cards[i].id, column.cards[i + 1].id);
        break; 
      }
    }
    
    if (mergingCardIds.length > 0) {
      set({ isAnimating: true, animatingCards: mergingCardIds });
      
      setTimeout(() => {
        const currentState = get();
        const newColumns = [...currentState.columns];
        const targetColumn = newColumns.find(col => col.id === columnId);
        
        if (targetColumn) {
          const { mergedColumn, scoreGained } = processChainMerge(targetColumn);
          const targetColumnIndex = newColumns.findIndex(col => col.id === columnId);
          newColumns[targetColumnIndex] = mergedColumn;
          
          set({ 
            columns: newColumns,
            isAnimating: false,
            animatingCards: []
          });
          
          if (scoreGained > 0) {
            get().addScore(scoreGained);
          }
          
          setTimeout(() => get().processMergeWithAnimation(columnId), 100);
        }
      }, 600);
    }
  },
}));
