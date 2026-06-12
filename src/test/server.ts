import { setupServer } from "msw/node";

// 빈 서버. 각 테스트가 server.use(...) 로 핸들러를 등록한다.
export const server = setupServer();
