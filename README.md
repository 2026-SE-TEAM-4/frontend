# frontend

서버 예약/할당 관리 시스템의 **프론트엔드**. React 18 + TypeScript + Vite SPA.
백엔드(FastAPI)와 실제로 연동되어 로그인·회원가입부터 서버 탐색→예약→반납,
알림·대시보드까지 동작한다. 디자인은 운영툴 톤의 **Style A**(라이트·Pretendard).

## 기술 스택

| 영역 | 사용 |
| --- | --- |
| 빌드/런타임 | Vite 5 · React 18 · TypeScript 5 |
| 라우팅 | react-router-dom 6 |
| 스타일 | Tailwind CSS 3 + Style A 디자인 토큰(`index.css`) |
| 테스트 | Vitest · React Testing Library · MSW |
| 폰트 | Pretendard (index.html에서 로드) |

## 빠른 시작

```bash
# 1) 백엔드 먼저 (별도 backend 레포)
cd ../backend && docker compose up -d
docker compose exec api alembic upgrade head
docker compose exec api python -m scripts.seed   # 데모 계정·팀·서버

# 2) 프론트엔드
cd ../frontend
npm install
npm run dev        # http://localhost:5173
```

### 데모 계정 (seed)

| 이메일 | 비밀번호 | 역할 |
| --- | --- | --- |
| hong@example.com | password123 | STU (학생·연구원) |
| kim@example.com | password123 | MGR (팀 관리자) |

회원가입 화면에서 **역할을 직접 지정**할 수 있다(과제 데모용 — 관리자(ADM)로도 가입 가능).

## 스크립트

```bash
npm run dev        # 개발 서버
npm run build      # 타입체크 + 프로덕션 빌드
npm run test       # Vitest (단위 + 흐름 테스트)
```

## 구조 개요

- `lib/api.ts` — 타입드 fetch 래퍼(Bearer 자동 첨부, `ApiError` 정규화).
- `context/AuthContext.tsx` — 로그인/세션 복원(JWT).
- `hooks/useApi.ts` — 조회 훅(loading/error/refetch). `useNotificationsSocket` — WS 알림.
- `layout/` — 앱 셸(상단바·역할별 사이드바·설계 추적 바).
- `features/` — 화면(기능별): auth · servers · reservations · notifications · dashboard.
- `routes/` — 인증·역할 가드, 역할별 네비 정의.

자세한 폴더 구조는 [`tree.md`](./tree.md), 설계는
[`docs/superpowers/specs/2026-06-12-frontend-integration-design.md`](./docs/superpowers/specs/2026-06-12-frontend-integration-design.md) 참조.

## 환경 변수 (`.env`)

| 키 | 기본 | 설명 |
| --- | --- | --- |
| VITE_BACKEND_URL | http://localhost:8000 | 백엔드 API (WS도 이 호스트를 ws:// 로 사용) |

`.env`는 git에 올리지 않는다(`.gitignore`). 예시는 `.env.example`.

## 보안 메모

- 액세스 토큰(JWT)을 `localStorage`에 보관한다. **과제 데모 편의를 위한 선택**으로,
  XSS에 노출될 수 있다. 운영 환경이라면 백엔드가 httpOnly·Secure 쿠키로 세션을 내려
  주고 프론트는 토큰을 직접 들지 않는 방식이 안전하다(`credentials: 'include'`).

## 관련 레포

- `backend` — FastAPI + APScheduler (통합 브랜치 `feature/integrate-ops-api`에 전체 API)
- `server-pool` — 메트릭 수집 대상 에이전트
- `diagram-and-docs` — 전체 설계 문서·화면 명세
