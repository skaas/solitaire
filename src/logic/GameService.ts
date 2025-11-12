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

    const { mergedCards, scoreGained, mergedCardIds } = processChainMerge(column.cards, {
      rng: state.rng,
    });

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
        const previousBest = column.cards.reduce((max, card) => Math.max(max, card.value), 0);
        const progress = useUIStore.getState();
        const isLocalRecord = newTopCard.value > previousBest;
        const isGlobalRecord = newTopCard.value > progress.maxFortuneValue;

        if (newTopCard.tier === 3) {
          if (!progress.hasSeenTier3) {
            latestUIState.addFortuneMessages([
              `✨ ${newTopCard.suitEmoji} ${newTopCard.suitLabel}(대운)이 깨어났습니다.`,
            ]);
            latestUIState.setFortuneProgress({ hasSeenTier3: true });
          } else if (newTopCard.value > progress.maxTier3Value) {
            latestUIState.addFortuneMessages([
              `🌈 ${newTopCard.suitEmoji} ${newTopCard.suitLabel}(대운)이 운의 정점에 도달했습니다.`,
            ]);
            latestUIState.setFortuneProgress({ maxTier3Value: newTopCard.value });
          } else {
            latestUIState.addFortuneMessages([
              `💫 또 다른 ${newTopCard.suitEmoji} ${newTopCard.suitLabel}(대운)이 반응합니다.`,
            ]);
          }
        } else {
          if (isLocalRecord) {
            latestUIState.addFortuneMessages([
              `${newTopCard.suitEmoji} ${newTopCard.suitLabel}(${newTopCard.value}) 운이 발견되었습니다.`,
            ]);
          }
          if (isGlobalRecord) {
            latestUIState.addFortuneMessages([
              `${newTopCard.suitEmoji} ${newTopCard.suitLabel}(${newTopCard.value})이 새로운 기록을 세웠습니다.`,
            ]);
            latestUIState.setFortuneProgress({ maxFortuneValue: newTopCard.value });
          }
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

