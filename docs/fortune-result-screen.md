# 결과 화면 로직 개요

## 전체 흐름
- 게임 종료 시 `GameService`가 `evaluateFortune(columns, queue)`를 호출해 `FortuneReport`를 생성합니다.
- `FortuneOverlay` 컴포넌트는 `FortuneReport`, 최종 점수(`score`), 재시작 콜백(`onRestart`)을 받아 결과 화면을 렌더링합니다.
- LLM 요약은 `createFortuneSummaryMessages()`로 프롬프트를 만들고, `requestFortuneSummary()`를 통해 GPT API에서 응답을 받아 표시합니다.

## FortuneReport 구조
- `topCards`: 상위 6장의 카드(값 기준 내림차순).
- `highestCard`: 최고 값 카드. 없으면 `null`.
- `tierCounts`: 각 티어별 카드 수(`1`, `2`, `3`).
- `dominantSuits`: 수트별 등장 횟수를 계산해 최대 4개를 노출.
- `volatility`, `volatilityScore`: 티어 가중치를 기반으로 한 에너지 변동 등급.
- `summaryLabel`, `summaryDetail`: 대표 요약 문구 및 세부 메시지.
- `narrativeLines`: 하이라이트 수트와 변동성에 맞춘 서사형 문장 배열.
- `timestamp`: 보고서 생성 시각(밀리초).

## FortuneReport 계산 공식
- **카드 수집**
  - `flattenBoard(columns)`로 모든 컬럼 카드를 펼친 뒤 값 내림차순으로 정렬.
  - 큐가 비어 있지 않으면 `queue` 카드를 포함해 다시 내림차순 정렬 → `allCards`.
- **`topCards`**
  - `allCards.slice(0, 6)`으로 상위 6장을 선택.
- **`highestCard`**
  - `allCards[0]`가 존재하면 그대로 사용, 없으면 `null`.
- **`tierCounts`**
  - `reduce`를 이용해 티어 1~3의 등장 횟수를 누적.
- **`dominantSuits`**
  - 수트별 등장 횟수를 Map으로 집계 후 `count` 내림차순으로 정렬, 상위 4개만 선택.
- **`volatilityScore`**
  - `tierCounts[3] * 3 + tierCounts[2] * 2 - tierCounts[1]`.
  - 점수 ≤ -2 → `stable`, 점수 ≤ 4 → `mixed`, 나머지는 `volatile`.
- **`summaryLabel`**
  - 최고 카드가 없으면 `"운세 데이터 없음"`.
  - 티어3 카드가 3장 이상이면 `"✨ 대운 폭주 ✨"`.
  - 최고 카드의 티어가 3이면 `"✨ 대운 상승기 ✨"`.
  - 티어2 수가 티어1 이상이면 `"상징 에너지 집중"`.
  - 그 외에는 `"일상 에너지 순환"`.
- **`summaryDetail`**
  - `highestCard`가 존재하면 `getSuitNarrative(highestCard.suitId, highestCard.tier)`.
  - 없으면 `"운세 요약을 생성할 수 없습니다."`.
- **`narrativeLines`**
  - `dominantSuits`를 순회하며 각 수트의 내러티브 문구를 추가.
  - 변동성이 `volatile`이면 `"⚡ 운의 기복이 큽니다..."`, `stable`이면 `"🌙 흐름이 차분합니다..."`를 덧붙임.

## 화면 섹션 정리
- **헤더**
  - 제목 “오늘의 운세”.
  - `report.timestamp`를 지역 시간으로 포맷.
  - 최종 점수(`score.toLocaleString()`).
- **핵심 요약**
  - `report.summaryLabel`, `summaryDetail` 표시.
  - 배경은 퍼플 계열 카드 스타일.
- **오늘의 운세 요약**
  - LLM 호출 상태에 따라 로딩/오류/결과/없음 메시지 분기.
  - `handleRetry()`로 요약 재요청 가능 (`requestKey` 업데이트).
- **핵심 카드 흐름**
  - `report.topCards` 루프.
  - `tierColorMap`으로 티어별 배경 변환.
  - 카드의 수트 이모지, 값, 수트 라벨을 보여줌.
- **등급 분포 & 에너지 변동**
  - `report.tierCounts`를 3단계로 나눠 리스트.
  - `volatilityScore`를 `+/-` 형식으로 노출.
  - `report.volatility` 값(stable/mixed/volatile)에 따라 설명 문구 변경.
- **Dominant Flow**
  - `report.dominantSuits`를 순회해 수트별 등장 횟수를 표시.
- **Narrative**
  - `report.narrativeLines`를 순차적으로 문단 형태로 렌더링.
- **재시작 버튼**
  - `onRestart` 콜백을 호출해 새 게임을 시작.

## LLM 요약 로직
- `createFortuneSummaryMessages({ report, score })`
  - 시스템/유저 메시지 페어를 생성.
  - 보고서의 주요 데이터를 JSON 텍스트로 포함해 GPT가 이해하기 쉽게 구성.
- `requestFortuneSummary(messages, { signal })`
  - AbortController로 중단 가능.
  - 결과 문자열을 `summary` 상태에 저장.
- 오류 처리
  - `AbortError`는 무시.
  - 그 외 오류는 `summaryError`에 사용자 친화 문구로 전달.
  - 사용자가 “다시 시도” 버튼으로 재요청 가능.

## 상태 로직
- `isLoadingSummary`: 요약 요청 진행 여부.
- `summary`: GPT 응답 텍스트.
- `summaryError`: 요약 실패 메시지.
- `requestKey`: 재요청 트리거. 변경 시 useEffect가 다시 실행되고 이전 요청은 `AbortController`로 취소.

## 시각 스타일
- 배경: 반투명 블랙 오버레이 + 퍼플 패널.
- Tailwind CSS 유틸리티로 색/폰트/레이아웃 정의.
- 티어에 따라 카드 배경 색상을 `tierColorMap`으로 조정.

## 확장 포인트
- 시드 기반 RNG 연결로 `FortuneReport`를 날짜·사용자별로 일관되게 유지할 수 있음.
- `summary` 프롬프트에 사용자 이름/실력 등 추가 컨텍스트를 넣을 수 있음.
- `report`에 새 필드가 추가되면 `FortuneOverlay`의 섹션을 확장하거나 LLM 프롬프트를 업데이트하면 됨.

