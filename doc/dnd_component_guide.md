# 범용 드래그 앤 드롭 컴포넌트 사용 가이드

이 문서는 `@dnd-kit` 라이브러리를 기반으로 생성된 범용 드래그 앤 드롭(D&D) 컴포넌트의 사용법을 안내합니다.

## 개요

재사용 가능한 D&D 기능을 구현하기 위해 3개의 핵심 컴포넌트를 만들었습니다.

1.  `DndContainer.tsx`: 전체 D&D 컨텍스트를 제공하고, 드래그 이벤트를 관리하는 최상위 컨테이너입니다.
2.  `Draggable.tsx`: 드래그할 수 있는 요소를 감싸는 컴포넌트입니다.
3.  `Droppable.tsx`: 드래그된 요소를 내려놓을 수 있는 영역을 감싸는 컴포넌트입니다.

이 컴포넌트들은 'Render Props'와 유사한 함수형 자식(function-as-a-child) 패턴을 사용하여, UI와 로직을 분리하고 높은 재사용성을 가집니다.

---

## 1. 컴포넌트 파일 위치

모든 관련 컴포넌트는 다음 디렉토리에 위치합니다.

```
src/components/dnd/
├── DndContainer.tsx
├── Draggable.tsx
└── Droppable.tsx
```

---

## 2. 컴포넌트 API 및 사용법

### 2.1. `<DndContainer />`

D&D 기능을 사용하려는 모든 컴포넌트들의 최상위 부모 역할을 합니다.

-   **Props**
    -   `children: React.ReactNode`: 내부에 렌더링될 자식 요소들입니다.
    -   `onDragEnd: (event: DragEndEvent) => void`: 드래그 작업이 끝났을 때 호출되는 필수 콜백 함수입니다. `DragEndEvent` 객체를 인자로 받아, 드래그된 요소(`active`)와 드롭된 위치(`over`) 정보를 바탕으로 실제 상태 업데이트 로직을 처리해야 합니다.

-   **예시**

```tsx
import { DndContainer } from './components/dnd/DndContainer';
import type { DragEndEvent } from '@dnd-kit/core';

const MyGame = () => {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      console.log(`아이템 ${active.id}가 ${over.id} 위로 드롭되었습니다.`);
      // 여기에 실제 게임 로직을 구현합니다. (예: 아이템 이동)
    }
  };

  return (
    <DndContainer onDragEnd={handleDragEnd}>
      {/* Draggable 및 Droppable 컴포넌트들이 이 안에 위치합니다. */}
    </DndContainer>
  );
};
```

### 2.2. `<Draggable />`

드래그하고 싶은 요소를 만들 때 사용합니다.

-   **Props**
    -   `id: string`: 드래그 가능한 요소를 식별하는 고유 ID입니다. `onDragEnd` 이벤트에서 `active.id`로 이 값을 참조합니다.
    -   `disabled?: boolean`: (선택 사항) `true`로 설정하면 해당 요소의 드래그 기능이 비활성화됩니다.
    -   `children: (isDragging, style, ref, attributes, listeners) => React.ReactElement`: **함수형 자식 패턴**을 사용합니다. 이 함수는 다음 인자들을 받아 UI를 렌더링해야 합니다.
        -   `isDragging: boolean`: 현재 드래그 중인지 여부입니다. 드래그 중일 때 스타일을 변경하는 데 사용할 수 있습니다.
        -   `style: CSSProperties`: 드래그 중인 요소의 위치와 `zIndex`를 포함하는 스타일 객체입니다. 반드시 대상 엘리먼트에 적용해야 합니다.
        -   `ref`: `@dnd-kit`이 DOM 노드를 참조하기 위해 필요한 `ref`입니다. 대상 엘리먼트의 `ref` 속성에 연결해야 합니다.
        -   `attributes`, `listeners`: 드래그 이벤트를 감지하기 위한 속성들입니다. 대상 엘리먼트에 `...attributes`, `...listeners` 형태로 전개하여 적용해야 합니다.

-   **예시**

```tsx
import { Draggable } from './components/dnd/Draggable';

const MyDraggableItem = ({ id }) => {
  return (
    <Draggable id={id}>
      {(isDragging, style, ref, attributes, listeners) => (
        <div
          ref={ref}
          style={style}
          {...attributes}
          {...listeners}
          className={`item ${isDragging ? 'dragging' : ''}`}
        >
          Item {id}
        </div>
      )}
    </Draggable>
  );
};
```

### 2.3. `<Droppable />`

아이템을 드롭할 수 있는 영역을 만들 때 사용합니다.

-   **Props**
    -   `id: string`: 드롭 가능한 영역을 식별하는 고유 ID입니다. `onDragEnd` 이벤트에서 `over.id`로 이 값을 참조합니다.
    -   `children: (isOver, ref) => React.ReactElement`: **함수형 자식 패턴**을 사용합니다.
        -   `isOver: boolean`: 드래그 중인 아이템이 현재 이 영역 위에 있는지 여부입니다. 하이라이트 효과 등 시각적 피드백을 주는 데 유용합니다.
        -   `ref`: `@dnd-kit`이 DOM 노드를 참조하기 위해 필요한 `ref`입니다. 대상 엘리먼트의 `ref` 속성에 연결해야 합니다.

-   **예시**

```tsx
import { Droppable } from './components/dnd/Droppable';

const MyDropZone = ({ id }) => {
  return (
    <Droppable id={id}>
      {(isOver, ref) => (
        <div
          ref={ref}
          className={`drop-zone ${isOver ? 'highlight' : ''}`}
        >
          Drop here
        </div>
      )}
    </Droppable>
  );
};
```

---

## 3. 종합 예시: 간단한 목록 아이템 옮기기

```tsx
// App.tsx
import React, { useState } from 'react';
import { DndContainer } from './components/dnd/DndContainer';
import { Draggable } from './components/dnd/Draggable';
import { Droppable } from './components/dnd/Droppable';
import type { DragEndEvent } from '@dnd-kit/core';

const initialItems = {
  container1: ['A', 'B', 'C'],
  container2: ['D', 'E', 'F'],
};

function App() {
  const [items, setItems] = useState(initialItems);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;
    
    // 아이템이 어느 컨테이너에 속해있는지 찾기
    const activeContainer = Object.keys(items).find(key => items[key].includes(active.id));
    const overContainer = over.id.toString();

    if (!activeContainer || activeContainer === overContainer) return;

    setItems((prev) => {
      const activeItems = [...prev[activeContainer]];
      const overItems = [...prev[overContainer]];

      const activeIndex = activeItems.indexOf(active.id);
      activeItems.splice(activeIndex, 1);
      overItems.push(active.id);
      
      return {
        ...prev,
        [activeContainer]: activeItems,
        [overContainer]: overItems,
      };
    });
  };

  return (
    <DndContainer onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
        {Object.keys(items).map((containerId) => (
          <Droppable key={containerId} id={containerId}>
            {(isOver, ref) => (
              <div ref={ref} className={`container ${isOver ? 'highlight' : ''}`}>
                <h3>{containerId}</h3>
                {items[containerId].map((itemId) => (
                  <Draggable key={itemId} id={itemId}>
                    {(isDragging, style, draggerRef, attributes, listeners) => (
                      <div ref={draggerRef} style={style} {...attributes} {...listeners} className={`item ${isDragging ? 'dragging' : ''}`}>
                        {itemId}
                      </div>
                    )}
                  </Draggable>
                ))}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DndContainer>
  );
}

export default App;

/* CSS 예시 */
/*
.container { border: 2px solid #ccc; padding: 10px; min-height: 100px; }
.container.highlight { border-color: green; }
.item { padding: 10px; margin: 5px 0; background: #f0f0f0; border: 1px solid #ddd; }
.item.dragging { opacity: 0.5; }
*/
```

이 가이드를 통해 다른 프로젝트에서도 손쉽게 드래그 앤 드롭 기능을 구현할 수 있기를 바랍니다. 