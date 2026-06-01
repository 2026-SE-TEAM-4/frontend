# frontend

서버 예약/할당 관리 시스템의 **프론트엔드**. React 18 + TypeScript + Vite 기반 SPA.

> **현재 상태: 기초공사 단계.** 기술 스택을 깔아 두고, 메인 페이지에서 백엔드·서버 풀의
> 연결 상태만 텍스트로 표시한다. 유스케이스 화면(예약·승인·대시보드 등)은 후속 단계다.
> 전체 설계는 `diagram-and-docs`와 Notion을 참조한다.

## 기술 스택

| 영역 | 사용 |
| --- | --- |
| 빌드/런타임 | Vite 5 · React 18 · TypeScript 5 |
| 스타일 | Tailwind CSS 3 · shadcn/ui · tailwindcss-animate |
| 차트 | Recharts (의존성만, 화면은 후속) |
| 폰트 | Pretendard (웹폰트, index.html에서 로드) |
| 컨테이너 | Docker (build → nginx) |

## 빠른 시작

```bash
npm install
npm run dev        # http://localhost:5173
```

또는 컨테이너로:

```bash
docker compose up --build   # http://localhost:5173 (nginx)
```

## 메인 페이지

`src/App.tsx` 는 `src/config/services.ts` 의 서비스 목록(백엔드 :8000, 서버 풀 :9101–9103)에
대해 `/health` 를 호출하고 **연결됨 / 끊김 / 확인 중**을 텍스트로 표시한다.
연결 점검은 best-effort이며, 교차 출처(CORS)·프록시 설정은 후속 단계다.

## 환경 변수 (`.env`)

| 키 | 기본 | 설명 |
| --- | --- | --- |
| VITE_BACKEND_URL | http://localhost:8000 | 백엔드 API |
| VITE_POOL1_URL ~ 3 | http://localhost:9101~9103 | 서버 풀 에이전트 |

`.env`는 git에 올리지 않는다(`.gitignore`). 예시는 `.env.example`.

## 관련 레포

- `backend` — FastAPI + APScheduler
- `server-pool` — 메트릭 수집 대상 에이전트
- `diagram-and-docs` — 전체 설계 문서
