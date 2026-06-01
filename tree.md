# frontend 디렉토리 구조

React 18 + Vite + TypeScript 기반 SPA. 기초공사 단계이며, 메인 페이지는 서비스
연결 상태만 표시한다.

파일은 기능 추가에 따라 바뀌지만, 아래 구조는 가능한 고정한다.
새 파일을 추가하기 전에 어느 폴더에 속하는지 본 문서로 확인한다.
구조를 바꿔야 하면 코드보다 먼저 본 문서를 갱신한다.

```text
frontend/
├── public/                    # 정적 자산 (후속)
├── src/
│   ├── main.tsx               # React 진입점
│   ├── App.tsx                # 메인 페이지 (서비스 연결 상태)
│   ├── index.css              # Tailwind 지시문 + 디자인 토큰 + Pretendard
│   ├── components/ui/         # shadcn/ui 컴포넌트 (badge 등)
│   ├── config/                # 설정 (services.ts: 상태 점검 대상)
│   └── lib/                   # 공용 유틸 (utils.ts: cn)
├── index.html                 # Pretendard 웹폰트 link 포함
├── vite.config.ts             # Vite + @ 별칭(src)
├── tailwind.config.js         # Tailwind v3 + shadcn 토큰
├── postcss.config.js
├── components.json            # shadcn 설정
├── tsconfig.json
├── package.json
├── Dockerfile                 # build(node) → nginx
├── nginx.conf
├── docker-compose.yml
├── .env.example
├── README.md
├── CLAUDE.md                  # 작업 시작 시 참조
├── tree.md                    # 본 파일
└── rule.md                    # 코딩 규칙
```

## 레이어 책임 요약

- `App.tsx` 는 화면 조립만 한다. 데이터 호출 로직이 커지면 `hooks/` 로 분리한다.
- `components/ui/` 는 shadcn/ui 프리미티브. 직접 만든 컴포넌트는 도메인 폴더에 둔다.
- `config/` 는 환경·상수. 비즈니스 로직을 넣지 않는다.
- `lib/` 는 순수 유틸. UI·상태에 의존하지 않는다.
