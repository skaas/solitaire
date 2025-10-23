import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Card, Column } from '../types';
import { createFiniteDeck, shuffleDeck, processAllMerges, createCardWithLuck } from '../logic/GameLogic';
import type { GameOverEvaluation } from './types';
import { clearMergeHistory } from '../logic/LuckTracker';

// GameState의 스냅샷 타입
interface GameState {
  score: number;
  time: number;
  columns: Column[];
  queue: Card[];
  deck: Card[];
  higherTierCardsAdded: boolean; // '32', '64' 카드 추가 여부 추적
  canPlaceCard: (card: Card, column: Column) => boolean;
  setColumns(columns: Column[]): void;
  setQueue(queue: Card[]): void;
  setDeck(deck: Card[]): void;
  addScore(points: number): void;
  setScore(score: number): void;
  resetState(): void;
  setHigherTierCardsAdded(value: boolean): void;
  setTime(time: number): void;
  incrementTime(): void;
  checkGameOver: () => GameOverEvaluation;
  unlockHigherTierCards: () => void;
}

// 게임 초기화 함수
const initializeGame = () => {
  clearMergeHistory();
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
    createCardWithLuck(2),
    createCardWithLuck(2),
    createCardWithLuck(2),
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
    higherTierCardsAdded: false,
  };
};

export const useGameStore = create<GameState>()(
  immer((set, get) => ({
    ...initializeGame(),

    canPlaceCard: (card: Card, column: Column): boolean => {
      if (column.cards.length === 0) {
        return true;
      }
      const topCard = column.cards[column.cards.length - 1];
      return card.value <= topCard.value;
    },

    setColumns: (columns) => set((state) => {
      state.columns = columns;
    }),
    setQueue: (queue) => set((state) => {
      state.queue = queue;
    }),
    setDeck: (deck) => set((state) => {
      state.deck = deck;
    }),
  
    checkGameOver: () => {
      const { columns, deck, queue, canPlaceCard } = get();

      const overflowingColumn = columns.find(col => col.cards.length >= 8);
      if (overflowingColumn) {
        return {
          isGameOver: true,
          triggerColumnId: overflowingColumn.id,
          reason: 'overflow' as const,
        };
      }

      if (deck.length === 0 && queue.length === 0) {
        return {
          isGameOver: true,
          triggerColumnId: null,
          reason: 'deckEmpty' as const,
        };
      }

      if (queue.length > 0) {
        const cardToMove = queue[queue.length - 1];
        const noValidMoves = columns.every(col => !canPlaceCard(cardToMove, col));
        if (noValidMoves) {
          return {
            isGameOver: true,
            triggerColumnId: null,
            reason: 'deadlock' as const,
          };
        }
      }

      return {
        isGameOver: false,
        triggerColumnId: null,
        reason: null,
      };
    },

    addScore: (points) => set((state) => {
      state.score += points;
    }),
    setScore: (score) => set((state) => {
      state.score = score;
    }),
    resetState: () => set(() => initializeGame()),
    setHigherTierCardsAdded: (value) => set((state) => {
      state.higherTierCardsAdded = value;
    }),
    setTime: (time) => set((state) => {
      state.time = time;
    }),
    incrementTime: () => set((state) => {
      state.time += 1;
    }),

    unlockHigherTierCards: () => {
      const { columns, deck, higherTierCardsAdded } = get();
      if (higherTierCardsAdded) return;

      const hasSixtyFourOrMore = columns.some(col => 
        col.cards.some(card => card.value >= 64)
      );

      if (hasSixtyFourOrMore) {
        const newCards: Card[] = [];
        // '32' 카드 18장 추가
        for (let i = 0; i < 18; i++) {
          newCards.push(createCardWithLuck(32));
        }
        // '64' 카드 4장 추가
        for (let i = 0; i < 4; i++) {
          newCards.push(createCardWithLuck(64));
        }
        
        const newDeck = shuffleDeck([...deck, ...newCards]);
        set((state) => {
          state.deck = newDeck;
          state.higherTierCardsAdded = true;
        });
      }
    },
  })),
);
