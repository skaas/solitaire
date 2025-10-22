export type GameOverReason = 'overflow' | 'deadlock' | 'deckEmpty';

export type GameOverEvaluation = {
  isGameOver: boolean;
  triggerColumnId: number | null;
  reason: GameOverReason | null;
};

export type UIStateSnapshot = {
  isGameOver: boolean;
  gameOverTriggerColumnId: number | null;
  gameOverReason: GameOverReason | null;
};

