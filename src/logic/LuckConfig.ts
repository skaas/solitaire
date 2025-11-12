import type { LuckSuitId, LuckTier } from '../types';

export const LUCK_TIER_LABEL: Record<LuckTier, string> = {
  1: '일상 흐름',
  2: '상징의 결실',
  3: '대운',
};

export const LUCK_TIER_SHORT_LABEL: Record<LuckTier, string> = {
  1: '1단계',
  2: '2단계',
  3: '대운',
};

export const LUCK_SUIT_CATALOG: Record< LuckSuitId, { emoji: string; label: string; tier: LuckTier } > = {
  growth: { emoji: '🌿', label: '성장', tier: 1 },
  stagnation: { emoji: '💤', label: '정체', tier: 1 },
  sprout: { emoji: '🌱', label: '시작', tier: 1 },
  change: { emoji: '🔮', label: '변화', tier: 1 },
  decline: { emoji: '🌧️', label: '저하', tier: 1 },
  love: { emoji: '❤️', label: '사랑', tier: 2 },
  wealth: { emoji: '💰', label: '재물', tier: 2 },
  completion: { emoji: '🌕', label: '완성', tier: 2 },
  happiness: { emoji: '☀️', label: '행복', tier: 2 },
  will: { emoji: '🔥', label: '의지', tier: 2 },
  destinyLove: { emoji: '💖', label: '사랑 (대운)', tier: 3 },
  destinyWealth: { emoji: '💎', label: '재물 (대운)', tier: 3 },
  destinyHappiness: { emoji: '🌞', label: '행복 (대운)', tier: 3 },
  destinyInsight: { emoji: '🪞', label: '깨달음', tier: 3 },
  destinyDecision: { emoji: '🔱', label: '결단', tier: 3 },
};

export const LUCK_TIER_POOLS: Record<LuckTier, LuckSuitId[]> = {
  1: ['growth', 'stagnation', 'sprout', 'change', 'decline'],
  2: ['love', 'wealth', 'completion', 'happiness', 'will'],
  3: ['destinyLove', 'destinyWealth', 'destinyHappiness', 'destinyInsight', 'destinyDecision'],
};

type EvolutionProbabilities = {
  tier1: number;
  tier2: number;
  tier3: number;
};

export const LUCK_EVOLUTION_TABLE: Record<number, EvolutionProbabilities> = {
  2: { tier1: 1, tier2: 0, tier3: 0 },
  4: { tier1: 1, tier2: 0, tier3: 0 },
  8: { tier1: 1, tier2: 0, tier3: 0 },
  16: { tier1: 0.9, tier2: 0.1, tier3: 0 },
  32: { tier1: 0.9, tier2: 0.1, tier3: 0 },
  64: { tier1: 0.9, tier2: 0.1, tier3: 0 },
  128: { tier1: 0.85, tier2: 0.1, tier3: 0.05 },
  256: { tier1: 0.8, tier2: 0.15, tier3: 0.05 },
  512: { tier1: 0.7, tier2: 0.2, tier3: 0.1 },
  1024: { tier1: 0.3, tier2: 0.4, tier3: 0.3 },
  2048: { tier1: 0, tier2: 0.5, tier3: 0.5 },
};

export const LUCK_SUIT_NARRATIVE: Record< LuckSuitId, { tier1: string; tier2: string; tier3: string } > = {
  growth: {
    tier1: '꾸준한 성장이 이어집니다. 작은 실천이 큰 변화를 부릅니다.',
    tier2: '성장이 가시화됩니다. 노력의 결실을 확인할 수 있습니다.',
    tier3: '성장의 대운이 폭발합니다. 새로운 차원의 도약이 찾아옵니다.',
  },
  stagnation: {
    tier1: '잠시 흐름이 느려집니다. 호흡을 고르고 균형을 맞추세요.',
    tier2: '정체 속에서 새로운 상징이 탄생합니다. 숨은 신호를 읽어보세요.',
    tier3: '대운을 앞둔 정지 신호입니다. 방향을 재정비하면 급상승합니다.',
  },
  sprout: {
    tier1: '새로운 시작의 맹아가 자랍니다. 용기를 내어 첫걸음을 떼세요.',
    tier2: '시작이 상징적인 사건으로 확장됩니다. 연결을 넓혀보세요.',
    tier3: '대운의 시작이 펼쳐집니다. 과감한 도전이 큰 변화를 만듭니다.',
  },
  change: {
    tier1: '작은 변화가 다가옵니다. 유연하면 순탄하게 넘어갑니다.',
    tier2: '변화가 핵심을 뒤흔듭니다. 패턴을 바꿀 준비를 하세요.',
    tier3: '운명이 크게 전환됩니다. 변화를 선택하면 대운이 열립니다.',
  },
  decline: {
    tier1: '기운이 잠시 낮아집니다. 휴식과 회복에 집중하세요.',
    tier2: '저하 속에서도 배움이 있습니다. 상황을 정리하면 다음이 밝습니다.',
    tier3: '정화의 폭풍이 지나갑니다. 대운 전에 필요 없는 것을 비우세요.',
  },
  love: {
    tier1: '사랑의 씨앗이 움틉니다. 공감이 관계를 따뜻하게 합니다.',
    tier2: '사랑의 상징이 빛납니다. 진심이 연결을 깊게 합니다.',
    tier3: '사랑의 대운이 열립니다. 관계가 새로운 차원으로 도약합니다.',
  },
  wealth: {
    tier1: '재정의 흐름이 안정됩니다. 작은 계획으로 시작하세요.',
    tier2: '재물의 결실이 보입니다. 가치 있는 제안에 집중하세요.',
    tier3: '재물의 대운이 열립니다. 예상치 못한 기회가 찾아옵니다.',
  },
  completion: {
    tier1: '마무리의 기운이 감돌고 있습니다. 미완의 일을 정리하세요.',
    tier2: '완성이 상징적으로 드러납니다. 성취를 나누면 더 커집니다.',
    tier3: '완성의 대운이 펼쳐집니다. 결과가 새로운 시작을 만듭니다.',
  },
  happiness: {
    tier1: '행복의 온기가 스며듭니다. 일상의 기쁨을 찾아보세요.',
    tier2: '행복의 상징이 반짝입니다. 주변과 기쁨을 나누세요.',
    tier3: '행복의 대운이 고조됩니다. 축복이 연달아 도착합니다.',
  },
  will: {
    tier1: '의지가 단단해집니다. 중심을 잡을수록 흐름이 안정됩니다.',
    tier2: '의지의 상징이 타오릅니다. 결단이 길을 엽니다.',
    tier3: '의지의 대운이 점화됩니다. 강한 추진력이 모든 것을 움직입니다.',
  },
  destinyLove: {
    tier1: '사랑의 대운이 미리 예고됩니다. 마음의 울림에 집중하세요.',
    tier2: '사랑의 대운이 곧 도착합니다. 관계가 새 국면에 진입합니다.',
    tier3: '사랑의 대운이 폭발합니다. 운명적 만남이 이루어집니다.',
  },
  destinyWealth: {
    tier1: '재물의 대운이 깨어납니다. 준비된 만큼 얻을 수 있습니다.',
    tier2: '재물의 문이 활짝 열립니다. 핵심 기회를 포착하세요.',
    tier3: '재물의 대운이 폭주합니다. 풍요가 지속적으로 찾아옵니다.',
  },
  destinyHappiness: {
    tier1: '행복의 대운이 예열됩니다. 감사의 감각을 키우세요.',
    tier2: '행복의 파동이 증폭됩니다. 즐거움이 연쇄적으로 이어집니다.',
    tier3: '행복의 대운이 정점입니다. 축복이 삶 전반으로 확장됩니다.',
  },
  destinyInsight: {
    tier1: '깨달음의 조짐이 나타납니다. 고요 속에서 답이 보입니다.',
    tier2: '깨달음이 상징적인 메시지로 다가옵니다. 직관을 따르세요.',
    tier3: '깨달음의 대운이 펼쳐집니다. 통찰이 모든 퍼즐을 맞춥니다.',
  },
  destinyDecision: {
    tier1: '결단의 기운이 싹틉니다. 작지만 확실한 선택이 필요합니다.',
    tier2: '결단의 상징이 드러납니다. 방향을 명확히 선언하세요.',
    tier3: '결단의 대운이 도착합니다. 당신의 선택이 운명을 엽니다.',
  },
};

function findEvolutionKey(value: number): number {
  const keys = Object.keys(LUCK_EVOLUTION_TABLE)
    .map((key) => Number(key))
    .sort((a, b) => a - b);

  let selected = keys[0];
  for (const key of keys) {
    if (value >= key) {
      selected = key;
    }
  }
  return selected;
}

export function getEvolutionProbabilities(value: number): EvolutionProbabilities {
  return LUCK_EVOLUTION_TABLE[findEvolutionKey(value)] ?? { tier1: 1, tier2: 0, tier3: 0 };
}

export function rollLuckTier(value: number, rng: () => number = Math.random): LuckTier {
  const probabilities = getEvolutionProbabilities(value);
  const roll = rng();

  if (roll < probabilities.tier1) {
    return 1;
  }
  if (roll < probabilities.tier1 + probabilities.tier2) {
    return 2;
  }
  return 3;
}

export function pickSuitForTier(
  tier: LuckTier,
  previousSuitId?: LuckSuitId,
  rng: () => number = Math.random,
): LuckSuitId {
  const pool = LUCK_TIER_POOLS[tier];
  if (pool.length === 0) {
    return previousSuitId ?? 'growth';
  }

  if (previousSuitId && LUCK_SUIT_CATALOG[previousSuitId].tier === tier) {
    // 50% 확률로 기존 문양 유지
    if (rng() < 0.5) {
      return previousSuitId;
    }
  }

  const index = Math.floor(rng() * pool.length);
  return pool[index];
}

export function getSuitNarrative(suitId: LuckSuitId, tier: LuckTier): string {
  const narrative = LUCK_SUIT_NARRATIVE[suitId];
  if (!narrative) {
    return '';
  }

  if (tier === 1) {
    return narrative.tier1;
  }
  if (tier === 2) {
    return narrative.tier2;
  }
  return narrative.tier3;
}

export type LuckAttributes = {
  tier: LuckTier;
  suitId: LuckSuitId;
  suitEmoji: string;
  suitLabel: string;
};

export function rollLuckAttributes(
  value: number,
  previousSuitId?: LuckSuitId,
  previousTier?: LuckTier,
  rng: () => number = Math.random,
): LuckAttributes {
  const tier = rollLuckTier(value, rng);
  const suitId = pickSuitForTier(tier, previousTier === tier ? previousSuitId : undefined, rng);
  const catalogEntry = LUCK_SUIT_CATALOG[suitId];

  return {
    tier,
    suitId,
    suitEmoji: catalogEntry.emoji,
    suitLabel: catalogEntry.label,
  };
}


