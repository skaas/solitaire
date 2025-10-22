Chain Solitaire 2048 - Web Version

✨ 타이틀

Chain Solitaire 2048 은 2048 수자 비기 방식을 가지고 있으며, 자유롭게 커충가능한 연상 비기(체인 매치)가 가능한 여름한 캐에지 플레이 가능한 오른손 리스 플랫폼 패스트와 상당히 비슷한 게임이다.

⸻

프로젝트 단계 구조 (Web Responsive Design)

✔ 1�8계: 기본 게임 진행 방식 구현

▶ UI 구조
	•	위: 점수 (score), 날짜적 시간 (time left)
	•	중앙: 4개의 칼드 배치 컨텐츠가 위치 (stack column style)
	•	하단: 3개의 대기 컨텐츠 (left-to-right fixed queue)
	•	안무: Undo (구보기 2구), Trash (버리기 1구)

▶ 기본 버튼 작동:
	•	컨텐츠 드래그 및 가방적 지정 사이에 컨텐츠 넣기
	•	Undo 버튼: 이전 상황으로 돌아가기
	•	Trash 버튼: 현재 접속 가능 컨텐츠 하나 버린기

▶ 가지 데이터:
	•	Card: { id, value, color, columnId, positionIndex }
	•	Column: [Card[]] 상학 되는 방식의 칼드 열

⸻

✔ 2�8계: 체인 비기 방식 모드 구현
	•	다음 조건을 만족하면 연상 매치로 컨텐츠 합치:
	1.	가장 바로 위에 같은 수가 2개 이상 있을 경우
	2.	카드가 합치되면, 새 카드가 나오고, 계속 합치 가능
	3.	이 목록을 중첩하고, 최종적으로 1개의 카드만 남음
	•	목록은 상당 많은 회수의 loop 또는 recursion으로 처리

⸻

✔ 3�8계: 대기 컨텐츠 협조
	•	하단 컨텐츠 3개 구조
	•	오른손 플랫폼에서 left-to-right 순서처럼 구현
	•	우측에서 생성되는 새 컨텐츠의 값은 2^n (계산 방식은 Math.pow(2, randomInt(1~n)))

⸻

✔ 4�8계: 버튼(구현) 개발
	•	Undo
	•	마지막 1~2개의 game state 복원 (JSON 지정)
	•	Stack / Column / Queue 상황 전체 복원
	•	Trash
	•	버리면 다음 컨텐츠 이동
	•	유지 횟수는 local state (1회) 표시

⸻

✔ 5�8계: 범위 상유 Responsive Web 구조
	•	Layout
	•	폴더 (column) 구조가 4개이며, 가로 가방적 작업이 가능�c 컨텐츠 stack 다구
	•	PC:
	•	hover UI + 다중 drag/drop 활용
	•	Mobile:
	•	long press + 다크립 또는 Tap-To-Move 형식 UI

⸻

✔ 6�8계: 목적 및 판단
	•	최대 카드 수: 2048
	•	점수: 합치 값의 총합
	•	특정 수 이상 합치한 경우 전쟁 (optional)

⸻

필요 파일
	•	Card.tsx (Card 컨텐츠)
	•	Column.tsx (column rendering)
	•	GameBoard.tsx (4-column 전체 UI)
	•	GameLogic.ts (merge & chain reaction logic)
	•	GameState.ts (Undo / Trash / Queue 관리)

