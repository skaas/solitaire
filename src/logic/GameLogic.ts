import type { Card, Column } from '../types';
import { rollLuckAttributes } from './LuckConfig';

let cardIdCounter = 1;

export function resetCardIdCounter(start = 1): void {
  cardIdCounter = start;
}

export function createCardWithLuck(
  value: number,
  options?: {
    sourceCards?: Card[];
    rng?: () => number;
  },
): Card {
  const rng = options?.rng ?? Math.random;
  const sourceCards = options?.sourceCards ?? [];
  const referenceCard = sourceCards[sourceCards.length - 1];
  const { tier, suitId, suitEmoji, suitLabel } = rollLuckAttributes(
    value,
    referenceCard?.suitId,
    referenceCard?.tier,
    rng,
  );

  return {
    id: cardIdCounter++,
    value,
    color: getColorForValue(value),
    tier,
    suitId,
    suitEmoji,
    suitLabel,
  };
}

/**
 * 카드를 특정 컬럼에 놓을 수 있는지 확인하는 함수 (솔리테어 규칙)
 * @param card - 놓으려는 카드
 * @param targetColumn - 목표 컬럼
 * @returns 놓을 수 있으면 true, 없으면 false
 */
export function canPlaceCard(card: Card, targetColumn: Column): boolean {
  // 빈 컬럼이면 항상 놓을 수 있음
  if (targetColumn.cards.length === 0) {
    return true;
  }
  
  // 최상단 카드 가져오기
  const topCard = targetColumn.cards[targetColumn.cards.length - 1];
  
  // 놓으려는 카드가 최상단 카드보다 작거나 같아야 함
  return card.value <= topCard.value;
}

/**
 * 카드 배치 불가능한 이유를 반환하는 함수
 * @param card - 놓으려는 카드
 * @param targetColumn - 목표 컬럼
 * @returns 불가능한 이유 메시지 (놓을 수 있으면 null)
 */
export function getPlacementErrorMessage(card: Card, targetColumn: Column): string | null {
  if (canPlaceCard(card, targetColumn)) {
    return null;
  }
  
  const topCard = targetColumn.cards[targetColumn.cards.length - 1];
  return `${card.value}은(는) ${topCard.value}보다 큰 값이므로 놓을 수 없습니다.`;
}

/**
 * 게임 상태에 따른 적절한 카드 생성 범위를 계산하는 함수
 * @param columns - 현재 컬럼 상태
 * @param score - 현재 점수
 * @returns 카드 생성 시 사용할 최대 파워 값
 */
export function calculateCardGenerationRange(columns: Column[], score: number): number {
  // 현재 게임에서 가장 높은 카드 값 찾기
  let maxCardValue = 2;
  columns.forEach(column => {
    column.cards.forEach(card => {
      if (card.value > maxCardValue) {
        maxCardValue = card.value;
      }
    });
  });

  // 가장 높은 카드 값에 따라 생성 범위 조정
  let maxPower = 3; // 기본값: 2^1~2^3 (2,4,8)
  
  if (maxCardValue >= 64) {
    maxPower = 5; // 2^1~2^5 (2,4,8,16,32)
  } else if (maxCardValue >= 32) {
    maxPower = 4; // 2^1~2^4 (2,4,8,16)
  } else if (maxCardValue >= 16) {
    maxPower = 4; // 2^1~2^4 (2,4,8,16)
  }

  // 점수에 따른 추가 조정
  if (score > 5000) {
    maxPower = Math.min(maxPower + 1, 6); // 최대 2^6 (64)까지
  }

  return maxPower;
}

/**
 * 새로운 카드를 생성하는 함수
 * @param maxPower - 2^n에서 n의 최대값 (기본값: 4, 즉 2^1~2^4 = 2,4,8,16)
 * @returns 새로 생성된 카드
 */
export function generateNewCard(maxPower: number = 4, rng: () => number = Math.random): Card {
  // 1부터 maxPower까지의 랜덤 정수
  const randomPower = Math.floor(rng() * maxPower) + 1;
  const value = Math.pow(2, randomPower);
  
  return createCardWithLuck(value, { rng });
}

/**
 * 컬럼 내에서 카드 병합을 처리합니다. (연쇄 병합)
 * @param column 병합을 체크할 컬럼
 * @returns 병합된 컬럼과 획득한 점수
 */
export function processChainMerge(
  cards: Card[],
  options?: {
    rng?: () => number;
  },
): {
  mergedCards: Card[];
  scoreGained: number;
  mergedCardIds: number[];
} {
  if (cards.length < 2) {
    return { mergedCards: cards, scoreGained: 0, mergedCardIds: [] };
  }

  let newCards = [...cards];
  let scoreGained = 0;
  let mergedCardIds: number[] = [];
  const rng = options?.rng ?? Math.random;
  
  // 맨 위 카드부터(배열의 끝) 역순으로 한 쌍만 체크
  const lastIndex = newCards.length - 1;
  if (newCards[lastIndex].value === newCards[lastIndex - 1].value) {
    const mergedValue = newCards[lastIndex].value * 2;
    scoreGained += mergedValue;
    
    mergedCardIds.push(newCards[lastIndex].id, newCards[lastIndex - 1].id);

    const newCard = createCardWithLuck(mergedValue, {
      sourceCards: [newCards[lastIndex], newCards[lastIndex - 1]],
      rng,
    });

    newCards = [...newCards.slice(0, lastIndex - 1), newCard];
  }

  return {
    mergedCards: newCards,
    scoreGained,
    mergedCardIds,
  };
}

/**
 * 컬럼의 모든 연쇄 병합을 한 번에 처리하는 함수 (초기 설정용)
 * @param column - 병합을 처리할 컬럼
 * @returns 병합된 컬럼과 획득한 점수
 */
export function processAllMerges(
  column: Column,
  options?: {
    rng?: () => number;
  },
): { mergedColumn: Column, scoreGained: number } {
  if (column.cards.length < 2) {
    return { mergedColumn: column, scoreGained: 0 };
  }

  let cards = [...column.cards];
  let totalScoreGained = 0;
  let hasChangedInLoop;
  const rng = options?.rng ?? Math.random;

  do {
    hasChangedInLoop = false;
    const newCards: Card[] = [];
    let i = 0;
    while (i < cards.length) {
      if (i < cards.length - 1 && cards[i].value === cards[i + 1].value) {
        const newValue = cards[i].value * 2;
        const mergedCard = createCardWithLuck(newValue, {
          sourceCards: [cards[i], cards[i + 1]],
          rng,
        });
        newCards.push(mergedCard);
        totalScoreGained += newValue;
        hasChangedInLoop = true;
        i += 2;
      } else {
        newCards.push(cards[i]);
        i++;
      }
    }
    cards = newCards;
  } while (hasChangedInLoop && cards.length >= 2);

  return {
    mergedColumn: { ...column, cards },
    scoreGained: totalScoreGained,
  };
}

/**
 * 정해진 개수로 유한한 카드 덱을 생성하는 함수
 * @returns 생성된 카드 덱
 */
export function createFiniteDeck(rng: () => number = Math.random): Card[] {
  const deckConfig = {
    '2': 24,
    '4': 18,
    '8': 12,
    '16': 6,
    // '32': 18, // 64 카드 생성 시 잠금 해제
    // '64': 4  // 64 카드 생성 시 잠금 해제
  };

  const deck: Card[] = [];

  for (const [valueStr, count] of Object.entries(deckConfig)) {
    const value = parseInt(valueStr, 10);
    for (let i = 0; i < count; i++) {
      deck.push(createCardWithLuck(value, { rng }));
    }
  }

  return deck;
}

/**
 * Fisher-Yates (aka Knuth) 셔플 알고리즘
 * @param array 셔플할 배열
 * @returns 셔플된 배열
 */
export function shuffleDeck(array: Card[], rng: () => number = Math.random): Card[] {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(rng() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

/**
 * 카드 값에 따른 색상을 반환하는 함수
 * @param value - 카드 값
 * @returns Tailwind CSS 색상 클래스
 */
export function getColorForValue(value: number): string {
  const colorMap: { [key: number]: string } = {
    2: 'bg-gray-400',
    4: 'bg-yellow-500',
    8: 'bg-orange-500',
    16: 'bg-red-500',
    32: 'bg-purple-500',
    64: 'bg-purple-500',
    128: 'bg-pink-500',
    256: 'bg-green-500',
    512: 'bg-blue-500',
    1024: 'bg-indigo-500',
    2048: 'bg-violet-500'
  };

  return colorMap[value] || 'bg-gray-600'; // 기본 색상
}
