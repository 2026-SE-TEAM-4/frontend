// 메인 페이지가 연결 상태를 점검할 서비스 목록.
// URL은 .env(VITE_*)로 덮어쓸 수 있고, 없으면 로컬 기본값을 쓴다.
export type Service = {
  name: string;
  url: string;
};

const env = import.meta.env;

const base = {
  backend: env.VITE_BACKEND_URL ?? "http://localhost:8000",
  pool1: env.VITE_POOL1_URL ?? "http://localhost:9101",
  pool2: env.VITE_POOL2_URL ?? "http://localhost:9102",
  pool3: env.VITE_POOL3_URL ?? "http://localhost:9103",
};

export const SERVICES: Service[] = [
  { name: "Backend API", url: base.backend + "/health" },
  { name: "Server-Pool agent #1", url: base.pool1 + "/health" },
  { name: "Server-Pool agent #2", url: base.pool2 + "/health" },
  { name: "Server-Pool agent #3", url: base.pool3 + "/health" },
];
