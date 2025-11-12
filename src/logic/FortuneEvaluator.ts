import type { Card, Column, FortuneHighlight, FortuneReport, FortuneVolatility, LuckTier, LuckSuitId } from '../types';
import { LUCK_SUIT_CATALOG, getSuitNarrative } from './LuckConfig';

function flattenBoard(columns: Column[]): Card[] {
  return columns.flatMap((column) => column.cards);
}

function sortCardsDesc(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => b.value - a.value);
}

function calculateTierCounts(cards: Card[]): Record<LuckTier, number> {
  return cards.reduce(
    (acc, card) => {
      acc[card.tier] = (acc[card.tier] ?? 0) + 1;
      return acc;
    },
    { 1: 0, 2: 0, 3: 0 } as Record<LuckTier, number>,
  );
}

function calculateSuitHighlights(cards: Card[]): FortuneHighlight[] {
  const counts = new Map<LuckSuitId, { card: Card; count: number }>();

  cards.forEach((card) => {
    const existing = counts.get(card.suitId);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(card.suitId, { card, count: 1 });
    }
  });

  return Array.from(counts.entries())
    .map(([suitId, data]) => ({
      suitId,
      suitEmoji: data.card.suitEmoji,
      suitLabel: data.card.suitLabel,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
}

function computeVolatility(tierCounts: Record<LuckTier, number>): { score: number; level: FortuneVolatility } {
  const score = tierCounts[3] * 3 + tierCounts[2] * 2 - tierCounts[1];

  if (score <= -2) {
    return { score, level: 'stable' };
  }
  if (score <= 4) {
    return { score, level: 'mixed' };
  }
  return { score, level: 'volatile' };
}

function deriveSummaryLabel(tierCounts: Record<LuckTier, number>, highestCard: Card | null): string {
  if (!highestCard) {
    return '운세 데이터 없음';
  }

  if (tierCounts[3] >= 3) {
    return '✨ 대운 폭주 ✨';
  }

  if (highestCard.tier === 3) {
    return '✨ 대운 상승기 ✨';
  }

  if (tierCounts[2] >= tierCounts[1]) {
    return '상징 에너지 집중';
  }

  return '일상 에너지 순환';
}

function buildNarrativeLines(highlights: FortuneHighlight[], volatility: FortuneVolatility, volatilityScore: number): string[] {
  const lines = highlights.map((highlight) => {
    const tier = LUCK_SUIT_CATALOG[highlight.suitId].tier;
    const narrative = getSuitNarrative(highlight.suitId, tier);
    return `${highlight.suitEmoji} ${highlight.suitLabel}: ${narrative}`;
  });

  if (volatility === 'volatile') {
    lines.push('⚡ 변화의 에너지가 넘칩니다. 새로운 기회를 적극적으로 잡아보세요.');
  } else if (volatility === 'stable') {
    lines.push('🌙 에너지가 낮아 안정적이지만, 무리한 추진보다는 차분한 조율이 필요합니다.');
  } else {
    lines.push('🌊 에너지가 교차합니다. 흐름을 읽으며 균형을 유지하면 좋은 결과로 이어집니다.');
  }

  if (volatilityScore < 0) {
    lines.push('🪻 기운이 살짝 낮아져 있습니다. 과도한 움직임보다는 기반을 다져보세요.');
  }

  return lines;
}

export function evaluateFortune(columns: Column[], queue: Card[]): FortuneReport {
  const boardCards = flattenBoard(columns);
  const relevantCards = sortCardsDesc(boardCards);
  const allCards = queue.length > 0 ? sortCardsDesc([...boardCards, ...queue]) : relevantCards;

  const highestCard = allCards[0] ?? null;
  const tierCounts = calculateTierCounts(allCards);
  const highlights = calculateSuitHighlights(allCards);
  const { score: volatilityScore, level: volatility } = computeVolatility(tierCounts);
  const summaryLabel = deriveSummaryLabel(tierCounts, highestCard);
  const summaryDetail = highestCard
    ? getSuitNarrative(highestCard.suitId, highestCard.tier)
    : '운세 요약을 생성할 수 없습니다.';
  const narrativeLines = buildNarrativeLines(highlights, volatility, volatilityScore);

  return {
    topCards: allCards.slice(0, 6),
    highestCard,
    tierCounts,
    dominantSuits: highlights,
    tier3Count: tierCounts[3],
    volatility,
    volatilityScore,
    summaryLabel,
    summaryDetail,
    narrativeLines,
    timestamp: Date.now(),
  };
}

