# 솔리테어 프로젝트 리팩토링 계획

이 문서는 `general_development_guide.md`와 `state_management_guide.md`에 명시된 개발 원칙에 따라 현재 솔리테어 프로젝트의 구조를 진단하고, 코드의 품질과 유지보수성을 향상시키기 위한 구체적인 리팩토링 계획을 제안합니다.

---

## 1. 프로젝트 구조 진단 (As-Is)

현재 프로젝트는 성공적으로 동작하고 있으나, 가이드라인에 비추어 볼 때 몇 가지 개선점을 발견할 수 있습니다.

### 진단 1: 상태와 행위의 책임 혼재 (원칙 위배: 상태 저장소는 데이터베이스처럼)

-   **현상:** `GameState.ts`의 `useGameStore`는 순수한 상태 데이터뿐만 아니라, `async/await`와 `setTimeout`을 포함하는 복잡한 비즈니스 로직(`processMergeWithAnimation`)을 함께 관리하고 있습니다. 또한, 상태를 변경하는 여러 단계의 로직이 `moveCardFromQueue` 함수 내에 직접 구현되어 있습니다.
-   **문제점:** 상태 변경의 흐름이 복잡하고 여러 곳에 흩어져 있어, 새로운 로직을 추가하거나 디버깅할 때 예측이 어렵습니다. 상태 변경이 비동기적으로 일어나므로 특정 시점의 상태를 추적하기 힘듭니다.

### 진단 2: 핵심 상태와 UI 상태의 혼합 (원칙 위배: 핵심 상태와 UI 상태 분리)

-   **현상:** `useGameStore`는 게임의 핵심 규칙(점수, 카드 위치)과 UI 표현을 위한 상태(`isAnimating`, `animatingCards`, `gameOverTriggerColumnId`, `gameOverReason`)를 모두 포함하고 있습니다.
-   **문제점:** UI 애니메이션 상태가 변경될 때마다, 이와 전혀 관련 없는 점수판 컴포넌트까지 불필요하게 리렌더링될 수 있습니다. 게임의 핵심 로직이 UI의 표현 방식에 강하게 의존하게 되어 유연성이 떨어집니다.

### 진단 3: 부수 효과의 불완전한 격리 (원칙 위배: 부수 효과 격리)

-   **현상:** `setTimeout`과 같은 부수 효과를 포함한 로직이 상태 저장소 내부에 직접 존재합니다.
-   **문제점:** 상태 저장소의 함수들이 더 이상 순수하지 않게 되어 테스트가 어려워지고, 동작을 예측하기 힘들어집니다.

---

## 2. 리팩토링 실행 계획 (To-Be)

위 진단을 바탕으로, 코드의 각 책임을 명확히 분리하고 데이터 흐름을 단순화하는 것을 목표로 다음과 같은 리팩토링을 제안합니다.

### 1단계: `GameService` 계층 도입하여 책임 분리

`GameState.ts`에서 복잡한 로직을 분리하여 `GameService.ts`를 생성하고, `useGameStore`는 순수한 상태와 액션만 남깁니다.

-   **액션 아이템:**
    1.  `src/logic/GameService.ts` 파일을 생성합니다.
    2.  다음 함수들을 `useGameStore`에서 `GameService.ts`로 이동시킵니다.
        -   `moveCardFromQueue`
        -   `undo`
        -   `trashCard`
        -   `processMergeWithAnimation`
        -   `resetGame`
    3.  `GameService`의 함수들은 내부 로직을 수행한 후, `useGameStore.getState().set...` 형태의 단순 액션을 호출하여 상태를 변경하도록 수정합니다.
    4.  `GameBoard.tsx`는 이제 `useGameStore`의 복잡한 함수 대신 `GameService.moveCard(...)` 와 같이 명확한 행위를 호출합니다.

### 2단계: UI 상태 분리를 위한 `useUIStore` 도입

게임 오버 연출 및 애니메이션과 관련된 상태를 별도의 스토어로 분리합니다.

-   **액션 아이템:**
    1.  `src/state/UIState.ts` 파일을 생성하고, `useUIStore`라는 새로운 Zustand 스토어를 정의합니다.
    2.  다음 상태들을 `useGameStore`에서 `useUIStore`로 이전합니다.
        -   `isAnimating`
        -   `animatingCards`
        -   `gameOverTriggerColumnId`
        -   `gameOverReason`
        -   `showGameOverPopup` (현재 `GameBoard`의 로컬 상태)
        -   `animationFinished` (현재 `GameBoard`의 로컬 상태)
    3.  `Card.tsx`, `Column.tsx`, `GameBoard.tsx`는 이제 UI 관련 상태를 `useUIStore`에서 가져오도록 수정합니다.

### 3단계: 불변성 강화를 위한 `immer` 미들웨어 적용

사람의 실수를 원천적으로 방지하기 위해 `useGameStore`와 `useUIStore`에 `immer`를 적용합니다.

-   **액션 아이템:**
    1.  `npm install immer` 명령어로 라이브러리를 설치합니다.
    2.  `useGameStore`와 `useUIStore`를 `create(immer((set, get) => ({ ... })))` 형태로 수정합니다.
    3.  상태를 업데이트하는 모든 `set` 함수 내부의 로직을, `...` 스프레드 연산자를 사용하는 대신 `state.score = newScore`와 같이 객체를 직접 수정하는 방식으로 간결하게 변경합니다.

---

## 3. 기대 효과

이 리팩토링 계획을 성공적으로 마치면, 우리 프로젝트는 다음과 같은 이점을 얻게 됩니다.

-   **명확해진 데이터 흐름:** 상태 변경은 `GameService`를 통해 예측 가능한 방식으로만 발생합니다.
-   **향상된 테스트 용이성:** 순수 함수로 분리된 게임 로직(`GameLogic.ts`)과 상태 변경 로직을 각각 독립적으로 테스트할 수 있습니다.
-   **감소된 복잡도:** 각 파일과 모듈이 단 하나의 책임만 가지게 되어, 코드를 이해하고 수정하기가 훨씬 쉬워집니다.
-   **최적화된 렌더링:** 핵심 게임 상태와 UI 상태가 분리되어, 불필요한 컴포넌트 리렌더링이 최소화됩니다.

이 계획은 당장 실행하지 않더라도, 앞으로의 유지보수 및 기능 추가 과정에서 훌륭한 가이드가 될 것입니다.
