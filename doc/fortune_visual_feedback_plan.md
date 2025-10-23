🎯 운의 진화 시각 피드백 구현 계획

## 1. 2단계(“운의 진화”) 핵심 사양 요약
- **색상 체계**: 카드 기본색 `#FFCC4D`(골드) 또는 `#FF89A0`(로즈 핑크), 하이라이트 `#FFF3B0`, 글자색 `#222222`, 배경 파동 `rgba(255,230,170,0.4)`, 효과 아이콘 `#FFD84D`.
- **애니메이션 타이밍**: 0.0s 카드 확대 1.2배 및 컬러 전환 → 0.2s 배경 원형 파동 확산 → 0.3s 카드 글로우 유지 → 0.4s 텍스트 “🌕 운이 진화했습니다” 페이드 인 → 1.2s 전체 페이드아웃.
- **텍스트 규칙**: 위치는 화면 상단 중앙, 16px 굵은 흰색 텍스트 + soft shadow, 페이드 인/아웃은 0.4s 속도로 진행.

## 2. 카드 합체 피드백 구조 설계
- **상태 흐름**
  1. `merge:start` (0.0~0.1s): 카드 확대와 동시에 색상 전환, 테두리 글로우 활성화.
  2. `merge:surge` (0.1~0.4s): 배경 파동 레이어가 확산하며 카드 글로우가 유지.
  3. `merge:settle` (0.4~1.2s): 텍스트 레이어가 등장하고 카드가 안정화되며 여운 연출.
- **레이어 우선순위**
  1. 카드 본체(값/문양)
  2. 카드 테두리 글로우 (`box-shadow`, `filter`)
  3. 배경 파동 (`radial-gradient` 또는 SVG)
  4. 텍스트 레이어 (상단 중앙, 의미 전달)
  5. 보조 입자나 광선 (필요 시 `::before`/`::after`)
- **이벤트 트리거**: 게임 로직에서 카드 합체 성공 시 UI 상태를 `good-fortune`으로 토글하고 1.2s 후 원상 복귀.

## 3. `src/index.css` 적용 전략
- **구조화**: 전역 CSS에 다음 상태 클래스를 추가해 Tailwind 유틸과 병행 적용.
  - `.fortune-card` (공통 카드 베이스)
  - `.fortune-card.is-merging` (합체 직후 상태, `transform: scale(1.2)`, `transition: transform 0.2s ease-out`)
  - `.fortune-card__glow` (테두리 글로우, `box-shadow`와 `filter: brightness()` 조합)
  - `.fortune-card__wave` (배경 파동, `position: absolute` + `radial-gradient`)
- **키프레임 제안**
  - `@keyframes fortuneWave`: `scale`과 `opacity`로 0.2~1.0s 파동 확산.
  - `@keyframes fortuneGlow`: 0.0~0.3s 사이 밝기 상승 후 유지.
  - `@keyframes fortuneText`: 0.4s 페이드 인, 0.4s 페이드 아웃.
- **상호 작용 제어**
  - 애니메이션 반복 방지를 위해 상태 클래스 토글 시 `animation-fill-mode: forwards` 사용.
  - 메인 게임 루프와 겹치지 않도록 `animation-delay`를 0.2s 이상으로 설정하여 이벤트 중첩을 방지.
- **CSS 변수 / Tailwind 연계**
  - `:root`에 `--fortune-gold: #FFCC4D`, `--fortune-wave: rgba(255,230,170,0.4)`와 같이 변수 선언.
  - Tailwind에서 `@layer components`를 활용하여 `.fortune-card` 관련 커스텀 클래스를 등록하고, 기존 유틸과 혼용 가능하게 설계.

## 4. 개발 체크리스트
- 카드 컴포넌트(`src/components/Card.tsx`)에 상태 클래스를 전달할 수 있는 속성 추가.
- 합체 UI 상태 관리(`src/state/UIState.ts`)에서 1.2s 동안 상태 유지 후 자동 초기화.
- 텍스트 연출은 오버레이 컴포넌트(`src/components/fortune/FortuneOverlay.tsx`)에서 렌더링하고 `fortuneText` 키프레임 사용.
- 모바일/데스크톱 모두에서 0.4~1.2s 애니메이션이 자연스러운지 DevTools에서 확인.

