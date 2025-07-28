import { create } from 'zustand';
import type { Card, Column } from '../types';
import { processChainMerge, createFiniteDeck, shuffleDeck, processAllMerges, getColorForValue } from '../logic/GameLogic';

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
  gameOverTriggerColumnId: number | null;
  gameOverReason: 'overflow' | 'deadlock' | 'deckEmpty' | null;
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
    gameOverTriggerColumnId: null,
    gameOverReason: null,
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

  moveCardFromQueue: (toColumnId: number) => {
    const state = get();
    if (state.isAnimating || state.isGameOver) return;
    if (state.queue.length === 0) return;

    const toColumn = state.columns.find(col => col.id === toColumnId);
    const cardToMove = state.queue[state.queue.length - 1];

    if (toColumn && cardToMove) {
      if (!get().canPlaceCard(cardToMove, toColumn)) {
        // 이곳에 유효하지 않은 이동에 대한 시각적 피드백(예: 카드 흔들기)을 추가할 수 있습니다.
        return;
      }
      
      const newQueue = state.queue.slice(0, -1);
      const newDeck = [...state.deck];
      const nextCard = newDeck.pop();
      if (nextCard) {
        newQueue.unshift(nextCard);
      }

      const newColumns = state.columns.map(col =>
        col.id === toColumnId
          ? { ...col, cards: [...col.cards, cardToMove] }
          : col
      );
      
      const currentState = get();
      const newHistory = [
        {
          columns: currentState.columns,
          queue: currentState.queue,
          deck: currentState.deck,
          score: currentState.score,
        },
        ...currentState.history,
      ].slice(0, 2);

      set({
        columns: newColumns,
        queue: newQueue,
        deck: newDeck,
        history: newHistory,
      });

      // 병합 프로세스를 시작합니다. 게임 오버 체크는 병합이 모두 끝난 후에 이루어집니다.
      setTimeout(() => get().processMergeWithAnimation(toColumnId), 100);
    }
  },

  undo: () => {
    const { history, undoCount } = get();
    if (undoCount > 0 && history.length > 0) {
      const lastState = history[0];
      set({
        ...lastState,
        history: history.slice(1),
        undoCount: undoCount - 1,
      });
      if (get().checkGameOver()) {
        set({ isGameOver: true });
      }
    }
  },

  trashCard: () => {
    const { queue, deck, trashCount } = get();
    if (trashCount > 0 && queue.length > 0) {
      const newQueue = queue.slice(0, -1);
      const newDeck = [...deck];

      const nextCard = newDeck.pop();
      if (nextCard) {
        newQueue.unshift(nextCard);
      }

      set({
        queue: newQueue,
        deck: newDeck,
        trashCount: trashCount - 1,
      });
      if (get().checkGameOver()) {
        set({ isGameOver: true });
      }
    }
  },

  checkGameOver: () => {
    const { columns, deck, queue, trashCount, canPlaceCard } = get();
    
    // 조건 1: 8장 이상 쌓인 컬럼
    const overflowingColumn = columns.find(col => col.cards.length >= 8);
    if (overflowingColumn) {
      set({ gameOverTriggerColumnId: overflowingColumn.id, gameOverReason: 'overflow' });
      return true;
    }
    
    // 조건 2: 덱과 큐가 모두 비었을 때
    if (deck.length === 0 && queue.length === 0) {
      set({ gameOverReason: 'deckEmpty' });
      return true;
    }

    // 조건 3: 교착 상태
    if (queue.length > 0) {
      const cardToMove = queue[queue.length - 1];
      const noValidMoves = columns.every(col => !canPlaceCard(cardToMove, col));
      if (noValidMoves && trashCount === 0) {
        set({ gameOverReason: 'deadlock' });
        return true;
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
  processMergeWithAnimation: async (columnId: number) => {
    const state = get();
    const column = state.columns.find(col => col.id === columnId);
    if (!column) return;

    // processChainMerge는 이제 컬럼 자체를 변경하지 않고, 변경될 카드 목록과 점수를 반환합니다.
    const { mergedCards, scoreGained, mergedCardIds } = processChainMerge(column.cards);

    if (scoreGained > 0) {
      // 애니메이션 시작
      set({ isAnimating: true });
      mergedCardIds.forEach((id: number) => get().setAnimatingCards([...get().animatingCards, id]));

      // 애니메이션을 보여줄 시간
      await new Promise(resolve => setTimeout(resolve, 600));

      set(currentState => {
        const newColumns = currentState.columns.map(c => 
          c.id === columnId ? { ...c, cards: mergedCards } : c
        );
        return { 
          columns: newColumns,
          score: currentState.score + scoreGained,
          isAnimating: false,
          animatingCards: get().animatingCards.filter((id: number) => !mergedCardIds.includes(id)),
        };
      });

      // 변경된 컬럼에 대해 재귀적으로 병합 확인
      get().processMergeWithAnimation(columnId);

    } else {
      // 더 이상 병합할 카드가 없으면, 이 시점에서 게임 오버를 최종적으로 체크합니다.
      if (get().checkGameOver()) {
        set({ isGameOver: true });
      }
    }
  },
}));
