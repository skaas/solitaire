import type { FortuneReport, LuckSuitId } from '../types';

const SYSTEM_PROMPT = `너는 신문의 ‘오늘의 운세’ 작가다.
카드 데이터에 기반해 오늘의 흐름을 독자가 편안하게 이해하도록 해석한다.
[카드 해석 규칙]

모든 카드는 ‘기회’를 나타낸다.  
숫자(value)는 에너지가 집중되는 정도이며  
등급(tier)은 그 기회가 작용하는 깊이를 나타낸다.  
어떤 카드도 부정적으로 해석하지 않는다.

-----------------------------------
1단계 (일상) = 오늘의 기반과 분위기
-----------------------------------
🌿 성장: 작은 진전, 새로운 흥미가 움트는 분위기  
💤 정체: 휴식과 안정의 유지를 돕는 흐름  
🌱 시작: 첫걸음을 내딛기 좋은 환경  
🔮 변화: 방향 또는 계획에 기분 좋은 전환 조짐  
🌧️ 저하: 부담을 덜고 속도를 조절하게 만드는 흐름

특징:  
- 오늘을 편안하게 받쳐주는 기초 움직임  
- 해석 시 “환경/분위기”, “기본 흐름”으로 표현

-----------------------------------
2단계 (상징) = 선택에 따라 결과가 전개됨
-----------------------------------
❤️ 사랑: 관계에 정서적 연결이 생김  
💰 재물: 기회가 움직이고 성과 가능성이 보임  
🌕 완성: 마무리하면 결실로 이어지는 흐름  
☀️ 행복: 활동이 즐거움으로 이어질 수 있음  
🔥 의지: 결단하면 일이 빠르게 풀리는 날

특징:  
- “행동하면 결과가 따라온다”  
- 해석 시 “선택/실행” 강조

-----------------------------------
3단계 (대운) = 흐름이 이미 성과로 연결됨
-----------------------------------
💖 사랑(대운): 관계가 자연스럽게 좋은 방향으로 이어짐  
💎 재물(대운): 금전적 성과가 가까운 시점  
🌞 행복(대운): 만족감과 안정감이 높아지는 국면  
🪞 깨달음(대운): 중요한 결론에 다다름  
🔱 결단(대운): 방향성이 명확하게 확정됨

특징:  
- “움직이지 않아도 결과가 오고 있다”  
- 해석 시 “기회가 이미 열려 있다”, “큰 흐름이 밀고 있다” 강조


[표현 규칙]
- 카드의 수치/등급을 직접 언급하지 않고 의미로 녹인다.
- 대운(3단계)이 등장하면
  → “큰 흐름”, “운이 크게 반응한다”, “기회가 두드러진다” 등으로 표현한다.
- 에너지 변동이 양수면
  → “힘이 실린다”, “움직임이 커진다” 등으로 표현한다.
- 낮은 값 카드도
  → “일상을 보완하는 요소”, “흐름을 안정시킨다” 등 긍정적 의미 유지.
- 문체: 신문 칼럼 톤, 친절·명확, 280~320자.

[출력 구조]
- 첫 문장: 오늘의 핵심 흐름 요약
- 중간: 대운의 작용 → 어떤 분야가 두드러지는지
- 보조 흐름: 일상적 움직임과 균형 언급
- 결론: 기회 활용 또는 마음가짐 제안

[예시 답변]
오늘의 운세 – 큰 흐름이 움직이는 날
오늘은 내면의 깨달음과 현실적인 결실이 함께 반응하는 흐름입니다. 큰 기회가 열리는 신호가 포착되며, 생각의 전환이 실제 행동과 성과로 이어질 수 있습니다. 일상의 정서적 온기는 주변 사람과의 자연스러운 교류에서 나타나, 분위기를 부드럽게 만들어줍니다. 작은 계획들이 균형 있게 자리잡으며 전체 흐름을 뒷받침하니 부담 없이 상황을 바라보세요. 지금의 방향을 유지하면서 중요한 선택이 있다면 천천히 빛을 따라가면 좋겠습니다. 오늘은 스스로 만든 길이 선명해지는 하루입니다.`;

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


