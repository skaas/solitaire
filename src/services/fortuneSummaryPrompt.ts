import type { FortuneReport, LuckSuitId } from '../types';

const SYSTEM_PROMPT = `너는 데이터 기반 ‘운 흐름’ 분석가다.
모든 카드는 운의 상태를 데이터처럼 읽어내는 신호로 해석한다.
숫자는 강도(value), 등급(tier)은 운의 깊이, 문양(suit)은 방향성을 나타낸다.

### 수치 기준:
128을 기준으로 해석하되, 다음과 같이 구분한다:
- 128 초과 → ‘확장 구간’ (운이 드러나거나 강화되는 흐름)
- 128 이하 → ‘시험 구간’ (상황이 정체되거나 시험을 겪는 흐름, 그러나 반드시 부정은 아님)

‘시험 구간’은 운의 약화가 아니라 **조정, 준비, 재정비의 단계**로 간주한다.
따라서 “위험/하락” 대신 “시험/조율” 등의 표현을 사용하라.

### 등급 의미:
- 1단계(일상의 흐름): 🌿 성장 / 💤 정체 / 🌱 시작 / 🔮 변화 / 🌧️ 저하
- 2단계(상징적 결실): ❤️ 사랑 / 💰 재물 / 🌕 완성 / ☀️ 행복 / 🔥 의지
- 3단계(운명의 절정): 💖 사랑 / 💎 재물 / 🌞 행복 / 🪞 깨달음 / 🔱 결단

### 분석의 원칙:
1. **중심 흐름:** 높은 값(128↑) & 높은 등급(2~3단계)
2. **보조 흐름:** 중간 또는 시험 구간(128↓, 등급 1~2)
3. **조율 신호:** 중심과 보조가 상반될 때 나타나는 긴장 또는 시험

추측, 신비주의, 감정 표현 금지.
명료하고 공적이며 데이터 리포트처럼 작성하라.`;

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
  logs: string[];
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatTopCards(report: FortuneReport): string {
  if (report.topCards.length === 0) {
    return '- 데이터 없음';
  }

  return report.topCards
    .map((card) => {
      const zone = card.value > 128 ? '확장 구간' : '시험 구간';
      return `- 문양: ${card.suitLabel} (${SUIT_MEANINGS[card.suitId]}) | 값: ${card.value} | 등급: ${card.tier}단계 | 구간: ${zone}`;
    })
    .join('\n');
}

function formatLogs(report: FortuneReport, logs: string[]): string {
  if (logs.length === 0) {
    return '- 기록 없음 | 최근 메시지가 없습니다.';
  }

  const latestFirst = [...logs].reverse();

  return latestFirst
    .map((message, index) => {
      const pseudoTimestamp = formatDate(report.timestamp - index * 60000);
      return `- ${pseudoTimestamp} | ${message}`;
    })
    .join('\n');
}

export function createFortuneSummaryMessages({ report, score, logs }: FortuneSummaryPromptInput) {
  const datetime = formatDate(report.timestamp);
  const energyDelta = report.volatilityScore >= 0 ? `+${report.volatilityScore}` : `${report.volatilityScore}`;
  const tier1Count = report.tierCounts[1] ?? 0;
  const tier2Count = report.tierCounts[2] ?? 0;
  const tier3Count = report.tierCounts[3] ?? 0;

  const userMessage = `[입력 데이터]
날짜/시각: ${datetime}
최종 점수: ${score}

핵심 카드 흐름:
${formatTopCards(report)}

등급 분포:
- 대운(3단계): ${tier3Count}장
- 상징(2단계): ${tier2Count}장
- 일상(1단계): ${tier1Count}장

에너지 변동: ${energyDelta}

로그(최신순):
${formatLogs(report, logs)}

[출력 포맷]
제목: 한 줄 요약(20자 이내, 분석적·객관적)

핵심 요약(3줄):
- 중심 흐름(128↑, 상위 등급):
- 시험 구간(128↓, 보조 등급):
- 조율 신호(양자 대비나 에너지 변동 관련):

해석(2~3문단):
- 중심과 시험 흐름의 상호작용.
- 등급 분포를 통한 운의 층위 분석.
- 에너지 변동이 보여주는 조정·확장 가능성.

근거(불릿 3~5개):
- 카드별 값/등급 기반 데이터 근거만 나열.

권고(3개):
- 중심 흐름을 유지하거나 시험 흐름을 관리하기 위한 실질적 제안.
- 금지어: ‘위험’, ‘불운’, ‘경고’. 대신 ‘조율’, ‘정비’, ‘유지’, ‘집중’ 사용.

[추가 규칙]
- 대운(3단계)이 포함되면 반드시 첫 문단에서 언급.
- 128 기준 구간을 명시적으로 인용 (예: “128 이하 2장 → 조율 신호로 작용”)
- 문양 이름은 그대로 사용하되, 내적 의미를 요약해 서술.
- 길이: 200~300자 내외.

🧮 해석 로직

구간\t명칭\t의미\t예시 표현
128 초과\t확장 구간\t외부로 확산, 결실, 행동, 전개\t“흐름이 뚜렷하게 상승하고 있습니다.”
128 이하\t시험 구간\t내부 조정, 일시 정체, 점검\t“조율의 흐름이 작동하며 방향을 확인하는 시기입니다.”`;

  return {
    system: SYSTEM_PROMPT,
    user: userMessage,
  };
}


