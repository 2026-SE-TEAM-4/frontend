# frontend 디렉토리 구조

React 18 + Vite + TypeScript SPA. 백엔드와 연동되는 운영툴 화면(Style A)을
기능별 폴더로 구성한다.

새 파일을 추가하기 전에 어느 폴더에 속하는지 본 문서로 확인한다.
구조를 바꿔야 하면 코드보다 먼저 본 문서를 갱신한다.

```text
frontend/
├── public/                    # 정적 자산
├── src/
│   ├── main.tsx               # 진입점 (BrowserRouter + AuthProvider)
│   ├── App.tsx                # 라우트 정의 + 보호/역할 가드
│   ├── index.css              # Tailwind 지시문 + Style A 토큰
│   ├── types/api.ts           # 백엔드 응답 타입
│   ├── lib/                   # api(fetch 래퍼·ApiError) · auth · format · utils
│   ├── context/               # AuthContext (로그인·세션)
│   ├── hooks/                 # useApi · useNotificationsSocket
│   ├── routes/                # RequireAuth · RequireRole · nav(역할별 메뉴)
│   ├── components/ui/         # Style A 프리미티브(Button·Input·Field·Segmented·
│   │                          #   StatusBadge·UsageBars·Table·Notice·Spinner)
│   ├── layout/                # AppShell · Topbar · Sidebar · TraceBar · PageHead
│   ├── features/              # 화면(기능별)
│   │   ├── admin/             #   AccountsPage(F20) · AdvancedPage(F35 고급 초기화)
│   │   ├── auth/              #   LoginPage(C1) · SignupPage(C2, 역할 지정)
│   │   ├── servers/           #   ServerListPage(S2) · useServers
│   │   ├── reservations/      #   ReservePage(S4) · MyReservationsPage(S5)
│   │   ├── notifications/     #   AlertsPage(S6)
│   │   └── dashboard/         #   DashboardPage(S1)
│   ├── components/ComingSoon  # 역할 전용 화면 자리(후속 계획)
│   └── test/                  # vitest setup · MSW 서버
├── docs/superpowers/          # 설계 spec · 구현 계획
├── index.html                 # Pretendard 웹폰트 link 포함
├── vite.config.ts             # Vite + @ 별칭(src)
├── vitest.config.ts           # jsdom · MSW setup
├── tailwind.config.js         # Tailwind v3 + shadcn 토큰
├── package.json
├── Dockerfile                 # build(node) → nginx
├── README.md · CLAUDE.md · tree.md · rule.md
```

## 레이어 책임 요약

- `App.tsx` 는 라우팅만. 화면은 `features/`, 셸은 `layout/`.
- `components/ui/` 는 프리미티브(도메인 무관). 도메인 컴포넌트는 해당 `features/` 폴더에.
- `lib/` 는 순수 유틸·API 클라이언트. UI·상태에 의존하지 않는다.
- `hooks/` 는 데이터·부수효과(조회·WS). `context/` 는 전역 상태(인증).
- 색·간격은 `index.css`의 Style A 토큰(`var(--…)`)을 쓰고 하드코딩하지 않는다.
