import type { Card } from '../types';

type FortuneSnapshot = {
  columnCards: Card[];
  mergedCards: Card[];
};

const mergeHistory: FortuneSnapshot[] = [];

export function recordMergeLuck(previousCards: Card[], mergedCards: Card[]): void {
  mergeHistory.push({ columnCards: [...previousCards], mergedCards: [...mergedCards] });
}

export function clearMergeHistory(): void {
  mergeHistory.splice(0, mergeHistory.length);
}

export function getMergeHistory(): FortuneSnapshot[] {
  return [...mergeHistory];
}

