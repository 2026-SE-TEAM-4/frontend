import { useEffect, useRef } from "react";

import { API_BASE, getToken } from "@/lib/api";

// 신규 알림이 오면 onMessage 를 호출한다. WebSocket 이 없거나(jsdom) 연결이 실패해도
// 앱은 정상 동작한다(목록 조회로 폴백). 토큰은 쿼리 파라미터로 전달한다(백엔드 계약).
export function useNotificationsSocket(onMessage: () => void) {
  const cb = useRef(onMessage);
  cb.current = onMessage;

  useEffect(() => {
    const token = getToken();
    if (!token || typeof WebSocket === "undefined") return;

    let ws: WebSocket | null = null;
    try {
      const wsBase = API_BASE.replace(/^http/, "ws");
      ws = new WebSocket(`${wsBase}/ws/notifications?token=${encodeURIComponent(token)}`);
      ws.onmessage = () => cb.current();
    } catch {
      ws = null;
    }
    return () => ws?.close();
  }, []);
}
