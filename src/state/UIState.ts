import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { FortuneReport } from '../types';

type AnimatingCards = number[];

export type GameOverReason = 'overflow' | 'deadlock' | 'deckEmpty' | null;

type UIState = {
  isAnimating: boolean;
  animatingCards: AnimatingCards;
  gameOverTriggerColumnId: number | null;
  gameOverReason: GameOverReason;
  isGameOver: boolean;
  animationFinished: boolean;
  fortuneReport: FortuneReport | null;
  queueShake: boolean;
  setAnimating: (isAnimating: boolean) => void;
  addAnimatingCards: (cardIds: number[]) => void;
  removeAnimatingCards: (cardIds: number[]) => void;
  clearAnimatingCards: () => void;
  setGameOver: (payload: { isGameOver: boolean; triggerColumnId: number | null; reason: GameOverReason | null }) => void;
  resetGameOver: () => void;
  setAnimationFinished: (finished: boolean) => void;
  setFortuneReport: (report: FortuneReport | null) => void;
  setQueueShake: (value: boolean) => void;
};

export const useUIStore = create<UIState>()(
  immer((set) => ({
    isAnimating: false,
    animatingCards: [],
    gameOverTriggerColumnId: null,
    gameOverReason: null,
    isGameOver: false,
    animationFinished: false,
    fortuneReport: null,
    queueShake: false,

    setAnimating: (isAnimating) => set((state) => {
      state.isAnimating = isAnimating;
    }),

    addAnimatingCards: (cardIds) =>
      set((state) => {
        state.animatingCards = Array.from(new Set([...state.animatingCards, ...cardIds]));
      }),

    removeAnimatingCards: (cardIds) =>
      set((state) => {
        state.animatingCards = state.animatingCards.filter((id) => !cardIds.includes(id));
      }),

    clearAnimatingCards: () => set((state) => {
      state.animatingCards = [];
    }),

    setGameOver: ({ isGameOver, triggerColumnId, reason }) =>
      set((state) => {
        state.isGameOver = isGameOver;
        if (isGameOver) {
          state.gameOverTriggerColumnId = triggerColumnId;
          state.gameOverReason = reason ?? null;
          state.animationFinished = false;
          state.queueShake = true;
        } else {
          state.gameOverTriggerColumnId = null;
          state.gameOverReason = null;
          state.animationFinished = false;
          state.fortuneReport = null;
          state.queueShake = false;
        }
      }),

    resetGameOver: () =>
      set((state) => {
        state.isGameOver = false;
        state.gameOverTriggerColumnId = null;
        state.gameOverReason = null;
        state.animationFinished = false;
        state.fortuneReport = null;
        state.queueShake = false;
      }),

    setAnimationFinished: (finished) =>
      set((state) => {
        state.animationFinished = finished;
        if (finished) {
          state.queueShake = false;
        }
      }),

    setFortuneReport: (report) =>
      set((state) => {
        state.fortuneReport = report;
      }),

    setQueueShake: (value) =>
      set((state) => {
        state.queueShake = value;
      }),
  })),
);

