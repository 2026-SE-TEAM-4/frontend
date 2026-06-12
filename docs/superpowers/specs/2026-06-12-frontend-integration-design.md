# 프론트엔드 ↔ 백엔드 연동 설계 (Style A)

작성 2026-06-12 · 대상 레포 `frontend` · 관련 `backend`(통합 브랜치 `feature/integrate-ops-api`) · 설계 출처 `diagram-and-docs`.

## 1. 목표

기존 프론트는 하드코딩 목업(`src/App.tsx` 1460줄, health check fetch 1개)뿐이다. 이를 **실제 백엔드와 연동되는 SPA**로 바꾼다. 로그인·회원가입(역할 직접 지정)부터 핵심 흐름(서버 탐색 → 예약 → 반납)까지 실제로 동작하게 하고, 역할(STU/MGR/ADM)별 화면을 `diagram-and-docs/docs-web/docs/06-screens/screen-design.md` 명세대로 구성한다.

비주얼은 `diagram-and-docs/frontend-design/index.html`의 **Style A**(라이트·Pretendard·운영툴 톤·`#0d6efd`)를 단일 출처로 따른다. 시안은 비주얼 컴패니언으로 확정함(아래 3절).

## 2. 백엔드 계약 (통합 브랜치 기준, 실제 동작 확인됨)

응답은 camelCase. 인증은 `Authorization: Bearer <JWT>`. 미인증 401 / 권한불일치 403 / 잠금 429.

| 메서드·경로 | 권한 | 용도 | 화면 |
|---|---|---|---|
| POST `/auth/register` `{name,email,password,role,teamId}` | 공개 | 가입(role 직접 지정) | C2 |
| POST `/auth/login` → `{accessToken,expiresIn,user}` | 공개 | 로그인 | C1 |
| GET `/auth/me` | 인증 | 내 정보 복원 | 부트스트랩 |
| GET `/teams` (신규·비인증, 본 작업서 추가) | 공개 | 가입 팀 선택 | C2 |
| GET `/servers?status&group&sort&order` → `{servers:[{id,name,status,spec,healthScore,occupant}]}` | 인증 | 서버 현황 | S1·S2 |
| GET `/servers/{id}` | 인증 | 서버 상세 | S3 |
| GET `/servers/{id}/health-trend` | MGR/ADM | 건강·위험 추세 | S3·A3 |
| GET `/servers/alternatives?serverId` | 인증 | 대안 서버 | S4 |
| POST `/servers` / DELETE `/servers/{id}` / POST `/servers/{id}/maintenances` | ADM | 서버 관리 | A2 |
| GET `/reservations` | 인증(범위 역할별) | 예약 현황 | S5·M3 |
| POST `/reservations` `{serverId,startTime,endTime}` | STU | 예약 생성 | S4 |
| POST `/reservations/instant` `{endTime}` | STU | 즉시 요청 | S2·S4 |
| POST `/reservations/{id}/cancel` · `/return` | 소유자 | 취소·반납 | S5 |
| POST `/approval-requests` / GET `/approval-requests` / POST `/{id}/decision` | STU / MGR·ADM | 승인 흐름 | S4·M1 |
| GET `/teams/{id}/quotas` / PATCH `/quotas/{id}` `{limit,version}` | MGR/ADM | Quota 조회·조정 | M2 |
| GET `/notifications` / PATCH `/notifications/{id}/read` | 인증·소유자 | 알림 | S6 |
| WS `/ws/notifications` | 인증 | 실시간 알림 | S6 |
| GET `/ops/dashboard` / `/ops/availability` | ADM | 운영 대시보드·가용성 | A1 |
| GET `/ops/incidents` `/{id}` `/{id}/summary` / `/ops/forecast` | MGR/ADM | AIOps | A3 |
| PATCH `/users/{id}/unlock` | ADM | 계정 잠금 해제 | A4·계정 |

> 주의: 백엔드 실제 스키마를 단일 출처로 삼는다(명세와 미세 차이 있음 — 예: `POST /reservations`에 version 필드 없음, instant는 `endTime`만). camelCase 별칭은 백엔드 Pydantic이 노출하는 그대로 사용.

## 3. 비주얼 설계 (확정)

- **테마 토큰**: Style A 팔레트/타이포를 CSS 변수로 박아 Tailwind와 매핑. 상태색 ok/use/rsv/mnt/dng, 숫자·코드는 JetBrains Mono(tabular-nums).
- **C1 로그인**: 가운데 카드형(브랜드·이메일·비번·에러·가입 링크).
- **C2 회원가입**: 역할 **세그먼트**(STU/MGR/ADM) + "과제 데모용: 역할 직접 지정" 안내, 팀 드롭다운. 중복 이메일/없는 팀 오류 표기.
- **앱 셸**: 상단바(브랜드 · 로그인 사용자+역할뱃지 · 로그아웃) + 역할별 사이드바(그룹 네비) + **설계 추적 바**(화면/API/기능F/UC/엔티티) + 메인.
- **테이블**: 고밀도, 상태 뱃지, 사양, 사용률 **미니 막대**(CPU/MEM/GPU), 건강점수 색상, 점유자(MGR·ADM 실명 / STU 팀코드), 가용 서버만 예약 활성.

## 4. 아키텍처

스택: React 18 + TypeScript + Vite + Tailwind(기존). 추가 의존성은 **`react-router-dom`만**.

- **라우팅**: `react-router-dom` v6. 공개(`/login`,`/signup`) + 보호 라우트(`<RequireAuth>`), 역할 가드(`<RequireRole roles=[...]>`). 기존 `useState` 페이지 전환 대체.
- **인증**: `AuthContext`(user·token·login·logout). JWT를 `localStorage`에 보관(course 데모; XSS 트레이드오프는 README에 메모). 부팅 시 토큰 있으면 `GET /auth/me`로 복원.
- **API 클라이언트**: `lib/api.ts` — 타입드 fetch 래퍼. Bearer 자동 첨부, 응답 파싱, 에러를 `ApiError{status,message}`로 정규화. `401`→로그아웃·`/login`, `403`→권한 토스트, `429`→잠금 안내, `409`→충돌(예약 대안 유도), `422`→Quota 승인 분기.
- **데이터 패칭**: 라이브러리 없이 `hooks/useApi.ts`(loading/error/data/refetch) + 변이는 핸들러에서 직접 호출. 서버 현황은 수동 새로고침 + 선택적 30초 폴링. 알림은 WS 구독 훅(`useNotificationsSocket`).
- **폴더 구조**(기능별):
  ```
  src/
    lib/{api.ts, auth.ts, format.ts}
    hooks/{useApi.ts, useNotificationsSocket.ts}
    context/AuthContext.tsx
    components/ui/*            # 버튼·뱃지·테이블·입력·세그먼트 등 Style A 프리미티브
    layout/{AppShell.tsx, Sidebar.tsx, Topbar.tsx, TraceBar.tsx}
    features/
      auth/{LoginPage.tsx, SignupPage.tsx}
      servers/{ServerListPage.tsx, ServerDetailPage.tsx}
      reservations/{ReservePage.tsx, MyReservationsPage.tsx}
      notifications/AlertsPage.tsx
      dashboard/DashboardPage.tsx
      approvals/ApprovalsPage.tsx        # MGR
      quota/QuotaPage.tsx                # MGR
      ops/{OpsDashboardPage.tsx, AvailabilityPage.tsx, AiopsPage.tsx}  # ADM
      admin/AccountsPage.tsx             # ADM
    routes.tsx
    App.tsx                              # 라우터 + 셸 조립(기존 목업 대체)
  ```
- **역할별 네비**: STU=대시보드·서버현황·내예약·알림 / MGR=+승인함·Quota·팀사용 / ADM=+운영대시보드·가용성·AIOps·서버관리·계정.

## 5. 구현 순서

1. **토대**: 토큰/Tailwind 매핑, `lib/api`, `AuthContext`, 라우터, `AppShell`/`Sidebar`/`Topbar`/`TraceBar`, UI 프리미티브.
2. **인증**: C1 로그인 · C2 회원가입(역할·팀). 백엔드 `GET /teams` 추가. 로그인→보호 라우트 진입.
3. **핵심 바퀴**: S2 서버 현황 → S4 예약 생성(+409 대안·422 승인 분기) → S5 내 예약(취소/반납). 즉시 요청 포함.
4. **S1 대시보드(요약)** · **S6 알림**(WS 배지·읽음).
5. **역할 화면**: MGR 승인함·Quota / ADM 운영 대시보드·가용성·서버 관리·계정 잠금 · AIOps(인시던트·예측·요약). S3 상세(메트릭·추세)는 이 단계.

## 6. 범위 밖 / 메모

- 비밀번호 재설정·이메일 인증·리프레시 토큰은 범위 밖(course 데모).
- 실시간 메트릭 차트는 백엔드가 노출하는 범위(health-trend·forecast) 내에서만. 1초 단위 라이브 스트림은 안 함.
- `localStorage` 토큰은 데모 편의. 운영이라면 httpOnly 쿠키 권장(README 메모).

## 7. 테스트

- 단위: `lib/api` 에러 정규화, 포맷 유틸, 역할 가드 로직(Vitest).
- 컴포넌트/흐름: 로그인→서버목록→예약 핵심 흐름(React Testing Library, MSW로 백엔드 목).
- 수동 E2E: 통합 백엔드(`docker compose up`) + seed 계정으로 로그인→예약→반납 시연.
