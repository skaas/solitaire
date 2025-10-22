import { processChainMerge } from './GameLogic';
import { useGameStore } from '../state/GameState';
import { useUIStore } from '../state/UIState';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const GameService = {
  moveCardFromQueue(toColumnId: number) {
    const state = useGameStore.getState();
    const uiState = useUIStore.getState();

    if (uiState.isAnimating || uiState.isGameOver) {
      return;
    }

    if (state.queue.length === 0) {
      return;
    }

    const targetColumn = state.columns.find((column) => column.id === toColumnId);
    const cardToMove = state.queue[state.queue.length - 1];

    if (!targetColumn || !cardToMove) {
      return;
    }

    if (!state.canPlaceCard(cardToMove, targetColumn)) {
      return;
    }

    const updatedQueue = state.queue.slice(0, -1);
    const updatedDeck = [...state.deck];
    const nextCard = updatedDeck.pop();

    if (nextCard) {
      updatedQueue.unshift(nextCard);
    }

    const updatedColumns = state.columns.map((column) =>
      column.id === toColumnId ? { ...column, cards: [...column.cards, cardToMove] } : column,
    );

    const historySnapshot = {
      columns: state.columns,
      queue: state.queue,
      deck: state.deck,
      score: state.score,
    };

    state.setHistory([historySnapshot, ...state.history].slice(0, 2));
    state.setColumns(updatedColumns);
    state.setQueue(updatedQueue);
    state.setDeck(updatedDeck);

    setTimeout(() => {
      void GameService.processMergeWithAnimation(toColumnId);
    }, 100);
  },

  undo() {
    const state = useGameStore.getState();
    const uiState = useUIStore.getState();
    const { history, undoCount } = state;

    if (undoCount === 0 || history.length === 0) {
      return;
    }

    const [previousState, ...remainingHistory] = history;

    state.setColumns(previousState.columns);
    state.setQueue(previousState.queue);
    state.setDeck(previousState.deck);
    state.setScore(previousState.score);
    state.setHistory(remainingHistory);
    state.setUndoCount(undoCount - 1);

    const gameOverEvaluation = state.checkGameOver();
    uiState.setGameOver(gameOverEvaluation);
  },

  trashCard() {
    const state = useGameStore.getState();
    const uiState = useUIStore.getState();
    const { queue, deck, trashCount } = state;

    if (trashCount === 0 || queue.length === 0) {
      return;
    }

    const updatedQueue = queue.slice(0, -1);
    const updatedDeck = [...deck];
    const nextCard = updatedDeck.pop();

    if (nextCard) {
      updatedQueue.unshift(nextCard);
    }

    state.setQueue(updatedQueue);
    state.setDeck(updatedDeck);
    state.setTrashCount(trashCount - 1);

    const gameOverEvaluation = state.checkGameOver();
    uiState.setGameOver(gameOverEvaluation);
  },

  async processMergeWithAnimation(columnId: number): Promise<void> {
    const state = useGameStore.getState();
    const uiState = useUIStore.getState();
    const column = state.columns.find((col) => col.id === columnId);

    if (!column) {
      return;
    }

    const { mergedCards, scoreGained, mergedCardIds } = processChainMerge(column.cards);

    if (scoreGained > 0) {
      uiState.setAnimating(true);
      uiState.addAnimatingCards(mergedCardIds);

      await delay(600);

      const latestState = useGameStore.getState();
      const latestUIState = useUIStore.getState();
      const newColumns = latestState.columns.map((col) =>
        col.id === columnId ? { ...col, cards: mergedCards } : col,
      );

      latestState.setColumns(newColumns);
      latestState.addScore(scoreGained);
      latestUIState.setAnimating(false);
      latestUIState.removeAnimatingCards(mergedCardIds);

      await GameService.processMergeWithAnimation(columnId);
      return;
    }

    state.unlockHigherTierCards();

    const gameOverEvaluation = state.checkGameOver();
    uiState.setGameOver(gameOverEvaluation);
  },

  resetGame() {
    const uiState = useUIStore.getState();
    uiState.resetGameOver();
    uiState.clearAnimatingCards();
    uiState.setAnimating(false);
    useGameStore.getState().resetState();
  },
};

export type GameServiceType = typeof GameService;

