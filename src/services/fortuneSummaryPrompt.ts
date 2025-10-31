import type { FortuneReport, LuckSuitId } from '../types';

const SYSTEM_PROMPT = `너는 데이터 기반 ‘운 흐름’ 분석가다.
모든 카드는 운의 상태를 데이터처럼 읽어내는 신호로 해석한다.
숫자(value)는 강도, 등급(tier)은 운의 깊이, 문양(suit)은 방향성을 의미한다.

128 기준:
- 128 초과 → 확장 구간(운이 드러나거나 강화)
- 128 이하 → 시험 구간(조정·정비 단계, 부정 아님)
“위험/하락” 표현 금지, 대신 “시험/조율” 사용.

등급 의미:
1단계(일상): 🌿성장 💤정체 🌱시작 🔮변화 🌧️저하
2단계(상징): ❤️사랑 💰재물 🌕완성 ☀️행복 🔥의지
3단계(대운): 💖사랑 💎재물 🌞행복 🪞깨달음 🔱결단

분석 원칙:
1) 중심 흐름: 높은 값(128↑) & 높은 등급(2~3단계)
2) 보조 흐름: 중간 또는 시험(128↓, 등급 1~2)
3) 조율 신호: 상반 작용 또는 에너지 변동

[출력 규칙]
- 형식: 오늘의 운세 (문단 1~2개)
- 길이: 280~320자
- 톤: 명료·공적·데이터 기반 리포트
- 감정적 과장/예언 금지(예: 행운이다!, 무조건 좋다!)
- 숫자, 등급, 문양 기반 근거를 자연스럽게 포함
- 독자가 이해할 수 있도록 흐름 간의 관계를 설명

이제 아래 입력 데이터 기준으로 오늘의 운세를 작성하라.`;

const SUIT_MEANINGS: Record<LuckSuitId, string> = {
  growth: '🌿 성장',
  stagnation: '💤 정체',
  sprout: '🌱 시작',
  change: '🔮 변화',
  decline: '🌧️ 저하',
  love: '❤️ 사랑',
  wealth: '💰 재물',
  completion: '🌕 완성',
  happiness: '☀️ 행복',
  will: '🔥 의지',
  destinyLove: '💖 사랑',
  destinyWealth: '💎 재물',
  destinyHappiness: '🌞 행복',
  destinyInsight: '🪞 깨달음',
  destinyDecision: '🔱 결단',
};

interface FortuneSummaryPromptInput {
  report: FortuneReport;
  score: number;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatTopCards(report: FortuneReport): string {
  if (report.topCards.length === 0) {
    return '';
  }

  return report.topCards
    .map((card) => {
      return `- ${SUIT_MEANINGS[card.suitId]} | ${card.value} | ${card.tier}단계`;
    })
    .join('\n');
}

export function createFortuneSummaryMessages({ report, score }: FortuneSummaryPromptInput) {
  const datetime = formatDate(report.timestamp);
  const energyDelta = report.volatilityScore >= 0 ? `+${report.volatilityScore}` : `${report.volatilityScore}`;
  const tier1Count = report.tierCounts[1] ?? 0;
  const tier2Count = report.tierCounts[2] ?? 0;
  const tier3Count = report.tierCounts[3] ?? 0;

  const userMessage = `날짜/시각: ${datetime}

최종 점수: ${score}

카드 목록:
${formatTopCards(report)}

등급 분포: 대운 ${tier3Count}, 상징 ${tier2Count}, 일상 ${tier1Count}

에너지 변동: ${energyDelta}`;

  return {
    system: SYSTEM_PROMPT,
    user: userMessage,
  };
}


