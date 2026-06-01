import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { SERVICES } from "@/config/services";

// 기초공사 단계: 각 서비스의 /health 를 한 번 호출해 연결 여부만 텍스트로 보여준다.
type Status = "checking" | "up" | "down";

const STATUS_LABEL: Record<Status, string> = {
  checking: "확인 중",
  up: "연결됨",
  down: "끊김",
};

function statusVariant(status: Status): "default" | "secondary" | "destructive" {
  if (status === "up") return "default";
  if (status === "down") return "destructive";
  return "secondary";
}

export default function App() {
  const [statuses, setStatuses] = useState<Record<string, Status>>(() =>
    Object.fromEntries(SERVICES.map((svc) => [svc.name, "checking" as Status])),
  );

  useEffect(() => {
    SERVICES.forEach(async (svc) => {
      try {
        const res = await fetch(svc.url, { signal: AbortSignal.timeout(3000) });
        setStatuses((prev) => ({ ...prev, [svc.name]: res.ok ? "up" : "down" }));
      } catch {
        // 네트워크 실패·CORS 차단·타임아웃은 모두 "끊김"으로 본다.
        setStatuses((prev) => ({ ...prev, [svc.name]: "down" }));
      }
    });
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-bold tracking-tight">
          서버 예약/할당 관리 — Frontend
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          기초공사 단계. 각 서비스의 연결 상태만 표시한다.
        </p>

        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-lg border border-border">
          {SERVICES.map((svc) => {
            const status = statuses[svc.name];
            return (
              <li
                key={svc.name}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <div className="font-medium">{svc.name}</div>
                  <div className="text-xs text-muted-foreground">{svc.url}</div>
                </div>
                <Badge variant={statusVariant(status)}>
                  {STATUS_LABEL[status]}
                </Badge>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
