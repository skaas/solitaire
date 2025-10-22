export type LuckTier = 1 | 2 | 3;

export type LuckSuitId =
  | 'growth'
  | 'stagnation'
  | 'sprout'
  | 'change'
  | 'decline'
  | 'love'
  | 'wealth'
  | 'completion'
  | 'happiness'
  | 'will'
  | 'destinyLove'
  | 'destinyWealth'
  | 'destinyHappiness'
  | 'destinyInsight'
  | 'destinyDecision';

export interface Card {
  id: number;
  value: number;
  color: string;
  tier: LuckTier;
  suitId: LuckSuitId;
  suitEmoji: string;
  suitLabel: string;
}

export interface Column {
  id: number;
  cards: Card[];
} 

export type FortuneVolatility = 'stable' | 'mixed' | 'volatile';

export interface FortuneHighlight {
  suitId: LuckSuitId;
  suitEmoji: string;
  suitLabel: string;
  count: number;
}

export interface FortuneReport {
  topCards: Card[];
  highestCard: Card | null;
  tierCounts: Record<LuckTier, number>;
  dominantSuits: FortuneHighlight[];
  tier3Count: number;
  volatility: FortuneVolatility;
  volatilityScore: number;
  summaryLabel: string;
  summaryDetail: string;
  narrativeLines: string[];
  timestamp: number;
}