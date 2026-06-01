import { useEffect, useState, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { SERVICES } from "@/config/services";

type Status = "checking" | "up" | "down";

interface MetricData {
  serverId: number;
  collectedAt: string;
  cpuUsage: number;
  memUsage: number;
  gpuUsage: number | null;
  netUsage: number;
  status: string;
}

export default function App() {
  const [statuses, setStatuses] = useState<Record<string, Status>>(() =>
    Object.fromEntries(SERVICES.map((svc) => [svc.name, "checking" as Status])),
  );
  const [metrics, setMetrics] = useState<Record<string, MetricData>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollingInterval = 3000; // 3s polling
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [autoPoll, setAutoPoll] = useState(true);

  const fetchServiceData = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all(
      SERVICES.map(async (svc) => {
        try {
          const res = await fetch(svc.url, { signal: AbortSignal.timeout(2500) });
          if (!res.ok) throw new Error("Response not OK");
          
          const data = await res.json();
          setStatuses((prev) => ({ ...prev, [svc.name]: "up" }));
          
          if (svc.url.endsWith("/metrics")) {
            setMetrics((prev) => ({ ...prev, [svc.name]: data as MetricData }));
          }
        } catch {
          setStatuses((prev) => ({ ...prev, [svc.name]: "down" }));
        }
      })
    );
    setLastRefreshed(new Date());
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchServiceData();
    
    if (!autoPoll) return;
    
    const interval = setInterval(() => {
      fetchServiceData();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [fetchServiceData, autoPoll]);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 font-mono text-sm antialiased">
      <div className="mx-auto max-w-2xl px-6 py-16">
        
        {/* 상단 헤더 및 심플 컨트롤 */}
        <header className="flex items-center justify-between border-b border-zinc-300 pb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              서버 예약/할당 관리 — Frontend
            </h1>
            <p className="mt-1 text-xs text-zinc-500 font-sans">
              실시간 서버 연결 및 자원 측정 현황
            </p>
          </div>

          <div className="flex items-center gap-2 font-sans">
            {/* 폴링 토글 */}
            <button
              onClick={() => setAutoPoll(!autoPoll)}
              className={`px-3 py-1 rounded border text-xs font-medium cursor-pointer transition-all ${
                autoPoll 
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700" 
                  : "bg-zinc-100 border-zinc-300 text-zinc-600"
              }`}
            >
              {autoPoll ? "● 실시간" : "○ 정지"}
            </button>

            {/* 새로고침 */}
            <button
              onClick={fetchServiceData}
              disabled={isRefreshing}
              className="px-3 py-1 rounded border border-zinc-300 bg-white hover:bg-zinc-100 text-xs font-medium text-zinc-700 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isRefreshing ? "갱신 중..." : "새로고침"}
            </button>
          </div>
        </header>

        {/* 서비스 리스트 */}
        <ul className="mt-8 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {SERVICES.map((svc) => {
            const status = statuses[svc.name];
            const metric = metrics[svc.name];
            const isUp = status === "up";

            return (
              <li
                key={svc.name}
                className="flex flex-col p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-zinc-800">{svc.name}</div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{svc.url}</div>
                  </div>
                  
                  <Badge variant={isUp ? "default" : "destructive"} className="px-2 py-0.5 text-xs font-sans rounded">
                    {isUp ? "연결됨" : "끊김"}
                  </Badge>
                </div>

                {/* 텍스트 메트릭 표기 */}
                {isUp && metric && (
                  <div className="mt-3 pt-3 border-t border-dashed border-zinc-150 text-xs text-zinc-600 font-mono flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div>
                      <span className="text-zinc-400 font-sans mr-1">CPU</span>
                      <span className="text-zinc-900 font-bold">{metric.cpuUsage}%</span>
                    </div>
                    <span className="text-zinc-300">|</span>
                    <div>
                      <span className="text-zinc-400 font-sans mr-1">RAM</span>
                      <span className="text-zinc-900 font-bold">{metric.memUsage}%</span>
                    </div>
                    <span className="text-zinc-300">|</span>
                    <div>
                      <span className="text-zinc-400 font-sans mr-1">GPU</span>
                      <span className="text-zinc-900 font-bold">
                        {metric.gpuUsage !== null ? `${metric.gpuUsage}%` : "N/A"}
                      </span>
                    </div>
                    <span className="text-zinc-300">|</span>
                    <div>
                      <span className="text-zinc-400 font-sans mr-1">NET</span>
                      <span className="text-zinc-900 font-bold">{metric.netUsage}%</span>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* 텍스트 푸터 */}
        <footer className="mt-6 flex items-center justify-between text-xs text-zinc-400 font-mono px-1">
          <div>
            수집 주기: {autoPoll ? "3초 자동 폴링 중" : "일시정지됨"}
          </div>
          <div>
            최종 갱신: {lastRefreshed.toLocaleTimeString()}
          </div>
        </footer>

      </div>
    </main>
  );
}


