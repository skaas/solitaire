import { processChainMerge } from './GameLogic';
import { useGameStore } from '../state/GameState';
import { useUIStore } from '../state/UIState';
import { recordMergeLuck } from './LuckTracker';
import { evaluateFortune } from './FortuneEvaluator';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const syncGameOverState = (): void => {
  const latestState = useGameStore.getState();
  const uiState = useUIStore.getState();
  const evaluation = latestState.checkGameOver();

  uiState.setGameOver(evaluation);

  if (evaluation.isGameOver) {
    const report = evaluateFortune(latestState.columns, latestState.queue);
    uiState.setFortuneReport(report);
  } else {
    uiState.setFortuneReport(null);
  }
};

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
    state.setColumns(updatedColumns);
    state.setQueue(updatedQueue);
    state.setDeck(updatedDeck);

    setTimeout(() => {
      void GameService.processMergeWithAnimation(toColumnId);
    }, 100);
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
      recordMergeLuck(column.cards, mergedCards);
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
      if (mergedCards.length > 0) {
        const newTopCard = mergedCards[mergedCards.length - 1];
        if (newTopCard.tier >= 2) {
          const messageLines = [
            newTopCard.tier === 3 ? '✨ 대운이 깨어났습니다 ✨' : '🌕 운이 진화했습니다',
            `${newTopCard.suitEmoji} ${newTopCard.suitLabel}`,
            `카드 값 ${newTopCard.value.toLocaleString()}으로 합체 완료`,
            '좋은 흐름이 이어집니다.',
          ];
          latestUIState.addFortuneMessages(messageLines);
        }
      }

      await GameService.processMergeWithAnimation(columnId);
      return;
    }

    state.unlockHigherTierCards();
    syncGameOverState();
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

