import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleGauge,
  Clock3,
  Cpu,
  Database,
  FileText,
  Gauge,
  HardDrive,
  Home,
  LockKeyhole,
  Menu,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  SlidersHorizontal,
  Unlock,
  UserCog,
  WifiOff,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { SERVICES } from "@/config/services";

type Status = "checking" | "up" | "down";
type PageKey =
  | "dashboard"
  | "servers"
  | "register"
  | "alternatives"
  | "availability"
  | "maintenance"
  | "usage"
  | "accounts"
  | "alerts"
  | "audit";

interface MetricData {
  serverId: number;
  collectedAt: string;
  cpuUsage: number;
  memUsage: number;
  gpuUsage: number | null;
  netUsage: number;
  status: string;
}

interface ServerRecord {
  id: number;
  name: string;
  group: string;
  ip: string;
  status: "운영 중" | "점검 중" | "경고" | "종료";
  health: number | null;
  cpu: number | null;
  memory: number | null;
  gpu: number | null;
  uptime: number | null;
  mtbf: number | null;
  mttr: number | null;
  lastCheck: string;
}

interface LockedUser {
  id: number;
  name: string;
  role: string;
  reason: string;
  lockedUntil: string;
  requests: number;
}

const pollingInterval = 30000;

const initialServers: ServerRecord[] = [
  {
    id: 1,
    name: "gpu-node-01",
    group: "GPU-Cluster-A",
    ip: "10.0.0.11",
    status: "운영 중",
    health: 92,
    cpu: 28,
    memory: 41,
    gpu: 63,
    uptime: 99.1,
    mtbf: 412,
    mttr: 0.8,
    lastCheck: "2026-06-12",
  },
  {
    id: 2,
    name: "gpu-node-02",
    group: "GPU-Cluster-A",
    ip: "10.0.0.12",
    status: "운영 중",
    health: 88,
    cpu: 35,
    memory: 48,
    gpu: 71,
    uptime: 98.7,
    mtbf: 398,
    mttr: 1.0,
    lastCheck: "2026-06-12",
  },
  {
    id: 3,
    name: "gpu-node-03",
    group: "GPU-Cluster-A",
    ip: "10.0.0.13",
    status: "경고",
    health: 79,
    cpu: 62,
    memory: 76,
    gpu: 82,
    uptime: 97.2,
    mtbf: 301,
    mttr: 1.6,
    lastCheck: "2026-06-12",
  },
  {
    id: 4,
    name: "gpu-node-04",
    group: "GPU-Cluster-B",
    ip: "10.0.1.11",
    status: "점검 중",
    health: null,
    cpu: null,
    memory: null,
    gpu: null,
    uptime: null,
    mtbf: null,
    mttr: null,
    lastCheck: "2026-06-13",
  },
  {
    id: 5,
    name: "cpu-node-01",
    group: "CPU-Cluster",
    ip: "10.0.2.21",
    status: "운영 중",
    health: 91,
    cpu: 22,
    memory: 38,
    gpu: null,
    uptime: 99.4,
    mtbf: 520,
    mttr: 0.6,
    lastCheck: "2026-06-12",
  },
  {
    id: 6,
    name: "cpu-node-02",
    group: "CPU-Cluster",
    ip: "10.0.2.22",
    status: "경고",
    health: 63,
    cpu: 71,
    memory: 68,
    gpu: null,
    uptime: 94.1,
    mtbf: 180,
    mttr: 2.3,
    lastCheck: "2026-06-11",
  },
  {
    id: 7,
    name: "storage-01",
    group: "Storage",
    ip: "10.0.3.31",
    status: "운영 중",
    health: 93,
    cpu: 18,
    memory: 34,
    gpu: null,
    uptime: 99.8,
    mtbf: 610,
    mttr: 0.4,
    lastCheck: "2026-06-12",
  },
  {
    id: 8,
    name: "legacy-01",
    group: "Legacy",
    ip: "10.0.9.41",
    status: "종료",
    health: null,
    cpu: null,
    memory: null,
    gpu: null,
    uptime: null,
    mtbf: null,
    mttr: null,
    lastCheck: "-",
  },
];

const usageTrend = [
  { time: "06-11 18:00", cpu: 24, memory: 39, gpu: 49, net: 180, availability: 98.8 },
  { time: "06-11 21:00", cpu: 42, memory: 51, gpu: 65, net: 260, availability: 99.1 },
  { time: "06-12 00:00", cpu: 37, memory: 46, gpu: 59, net: 220, availability: 98.9 },
  { time: "06-12 03:00", cpu: 34, memory: 43, gpu: 58, net: 190, availability: 99.3 },
  { time: "06-12 06:00", cpu: 45, memory: 56, gpu: 71, net: 305, availability: 99.0 },
  { time: "06-12 09:00", cpu: 39, memory: 44, gpu: 62, net: 240, availability: 98.6 },
  { time: "06-12 12:00", cpu: 31, memory: 41, gpu: 57, net: 220, availability: 98.2 },
];

const anomalyRows = [
  { level: "위험", server: "cpu-node-02", message: "CPU 사용률 95% 초과", time: "14:12" },
  { level: "경고", server: "gpu-node-03", message: "GPU 온도 89°C", time: "13:47" },
  { level: "경고", server: "cpu-node-02", message: "메모리 사용률 90% 초과", time: "12:31" },
];

const maintenanceRows = [
  {
    server: "gpu-node-04",
    date: "2026-06-13 02:00 ~ 04:00",
    reason: "정기 점검 및 드라이버 업데이트",
    status: "예정",
  },
  {
    server: "storage-02",
    date: "2026-06-14 01:00 ~ 02:30",
    reason: "디스크 교체 및 펌웨어 업데이트",
    status: "예정",
  },
  {
    server: "legacy-01",
    date: "2026-06-15 09:00 ~ 10:00",
    reason: "서비스 종료 전 백업 확인",
    status: "검토",
  },
];

const schedulerRows = [
  { name: "메트릭 수집", status: "성공", time: "14:35:00" },
  { name: "이상 탐지", status: "성공", time: "14:30:05" },
  { name: "건강 점수 계산", status: "성공", time: "14:30:04" },
  { name: "유휴 회수 검사", status: "성공", time: "14:30:03" },
  { name: "예약 전이 처리", status: "성공", time: "14:30:01" },
];

const alternativeRows = [
  { source: "gpu-node-03", name: "gpu-node-02", cpu: 16, memory: 64, gpu: "RTX4090", fit: 96 },
  { source: "gpu-node-03", name: "gpu-node-01", cpu: 16, memory: 64, gpu: "RTX4090", fit: 94 },
  { source: "cpu-node-02", name: "cpu-node-01", cpu: 32, memory: 128, gpu: "-", fit: 91 },
];

const auditRows = [
  { actor: "운영 관리자", action: "서버 등록", target: "gpu-node-04", time: "14:21:08" },
  { actor: "스케줄러", action: "유휴 회수 검사", target: "cpu-node-02", time: "14:15:03" },
  { actor: "운영 관리자", action: "계정 잠금 해제", target: "hong@example.com", time: "13:42:12" },
  { actor: "스케줄러", action: "건강 점수 계산", target: "전체 서버", time: "13:30:04" },
];

const initialLockedUsers: LockedUser[] = [
  {
    id: 1,
    name: "hong@example.com",
    role: "STU",
    reason: "60초 내 요청 121회",
    lockedUntil: "2026-06-12 15:01",
    requests: 121,
  },
  {
    id: 2,
    name: "kim@example.com",
    role: "MGR",
    reason: "토큰 실패 반복",
    lockedUntil: "2026-06-12 15:08",
    requests: 54,
  },
];

const pageGroups: Array<{ title: string; items: Array<{ key: PageKey; label: string; icon: LucideIcon }> }> = [
  {
    title: "운영",
    items: [
      { key: "dashboard", label: "대시보드", icon: Home },
      { key: "servers", label: "서버 현황", icon: Server },
      { key: "register", label: "서버 등록", icon: Plus },
      { key: "alternatives", label: "대안 서버", icon: ArrowRight },
    ],
  },
  {
    title: "관리",
    items: [
      { key: "availability", label: "가용성", icon: Gauge },
      { key: "maintenance", label: "점검 일정", icon: CalendarClock },
      { key: "usage", label: "사용성", icon: Activity },
      { key: "accounts", label: "계정 잠금", icon: LockKeyhole },
    ],
  },
  {
    title: "시스템",
    items: [
      { key: "alerts", label: "알림", icon: Bell },
      { key: "audit", label: "감사 로그", icon: FileText },
    ],
  },
];

const pageTitle: Record<PageKey, string> = {
  dashboard: "서버 운영 대시보드",
  servers: "서버 현황",
  register: "서버 등록",
  alternatives: "대안 서버 조회",
  availability: "가용성 현황",
  maintenance: "점검 스케줄",
  usage: "사용성 현황",
  accounts: "계정 잠금 관리",
  alerts: "알림",
  audit: "감사 로그",
};

const statusLabel: Record<Status, string> = {
  checking: "확인 중",
  up: "연결됨",
  down: "끊김",
};

function formatPercent(value: number | null) {
  return value === null ? "-" : `${value}%`;
}

function getHealthTone(value: number | null) {
  if (value === null) return "text-muted-foreground";
  if (value >= 85) return "text-emerald-700";
  if (value >= 70) return "text-amber-700";
  return "text-red-700";
}

function getUsageTone(value: number | null) {
  if (value === null) return "text-muted-foreground";
  if (value >= 80) return "text-red-600";
  if (value >= 60) return "text-amber-600";
  return "text-foreground";
}

function getStatusBadgeClass(status: ServerRecord["status"]) {
  if (status === "운영 중") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "점검 중") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (status === "경고") return "bg-red-50 text-red-700 ring-red-200";
  return "bg-muted text-muted-foreground ring-border";
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-md border border-border bg-card shadow-sm ${className}`}>{children}</section>;
}

function SectionHeader({
  title,
  action,
  count,
}: {
  title: string;
  action?: ReactNode;
  count?: number;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        {typeof count === "number" ? (
          <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs text-secondary-foreground">
            {count}
          </span>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function IconButton({
  icon: Icon,
  label,
  onClick,
  active = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-sm transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "checking") {
    return (
      <Badge variant="secondary" className="gap-1.5 rounded-md font-sans">
        <RefreshCw className="h-3 w-3 animate-spin" />
        {statusLabel[status]}
      </Badge>
    );
  }

  if (status === "up") {
    return (
      <Badge className="gap-1.5 rounded-md bg-emerald-600 font-sans text-white hover:bg-emerald-600">
        <CheckCircle2 className="h-3 w-3" />
        {statusLabel[status]}
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="gap-1.5 rounded-md font-sans">
      <WifiOff className="h-3 w-3" />
      {statusLabel[status]}
    </Badge>
  );
}

function ServerStatusBadge({ status }: { status: ServerRecord["status"] }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClass(status)}`}>
      {status}
    </span>
  );
}

function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "default" | "green" | "blue" | "amber" | "red";
}) {
  const toneClass = {
    default: "text-foreground",
    green: "text-emerald-700",
    blue: "text-blue-700",
    amber: "text-amber-700",
    red: "text-red-700",
  }[tone];

  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className={`mt-3 font-mono text-3xl font-bold tracking-normal ${toneClass}`}>{value}</div>
      <p className="mt-2 truncate text-xs text-muted-foreground">{detail}</p>
    </Panel>
  );
}

function UsageChart({
  title,
  value,
  change,
  dataKey,
  color,
}: {
  title: string;
  value: string;
  change: string;
  dataKey: "cpu" | "memory" | "gpu" | "net";
  color: string;
}) {
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-mono text-2xl font-bold">{value}</span>
            <span className="text-xs font-semibold text-emerald-700">{change}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={usageTrend} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${dataKey}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={34} />
            <Tooltip
              contentStyle={{
                border: "1px solid hsl(var(--border))",
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill={`url(#fill-${dataKey})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function MetricBar({ value }: { value: number | null }) {
  const width = value === null ? 0 : Math.min(100, Math.max(0, value));
  const color = width >= 80 ? "bg-red-500" : width >= 60 ? "bg-amber-500" : "bg-emerald-600";

  return (
    <div className="flex items-center gap-2">
      <span className={`w-9 text-right font-mono text-xs font-semibold ${getUsageTone(value)}`}>
        {formatPercent(value)}
      </span>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ServerTable({
  servers,
  selectedId,
  onSelect,
}: {
  servers: ServerRecord[];
  selectedId: number | null;
  onSelect: (server: ServerRecord) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
            <th className="px-4 py-3">서버명</th>
            <th className="px-3 py-3">그룹</th>
            <th className="px-3 py-3">상태</th>
            <th className="px-3 py-3">건강</th>
            <th className="px-3 py-3">CPU</th>
            <th className="px-3 py-3">메모리</th>
            <th className="px-3 py-3">GPU</th>
            <th className="px-3 py-3">가동률</th>
            <th className="px-3 py-3">MTBF</th>
            <th className="px-3 py-3">MTTR</th>
            <th className="px-4 py-3">작업</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {servers.map((server) => (
            <tr
              key={server.id}
              className={`transition-colors hover:bg-muted/30 ${
                selectedId === server.id ? "bg-blue-50/70" : "bg-card"
              }`}
            >
              <td className="px-4 py-3">
                <div className="font-semibold">{server.name}</div>
                <div className="font-mono text-xs text-muted-foreground">{server.ip}</div>
              </td>
              <td className="px-3 py-3 text-muted-foreground">{server.group}</td>
              <td className="px-3 py-3">
                <ServerStatusBadge status={server.status} />
              </td>
              <td className="px-3 py-3">
                <span className={`font-mono font-semibold ${getHealthTone(server.health)}`}>
                  {server.health ?? "-"}
                </span>
              </td>
              <td className="px-3 py-3">
                <MetricBar value={server.cpu} />
              </td>
              <td className="px-3 py-3">
                <MetricBar value={server.memory} />
              </td>
              <td className="px-3 py-3">
                <MetricBar value={server.gpu} />
              </td>
              <td className="px-3 py-3 font-mono">{server.uptime ? `${server.uptime}%` : "-"}</td>
              <td className="px-3 py-3 font-mono">{server.mtbf ? `${server.mtbf}h` : "-"}</td>
              <td className="px-3 py-3 font-mono">{server.mttr ? `${server.mttr}h` : "-"}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onSelect(server)}
                  className="h-8 rounded-md border border-blue-200 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                >
                  상세
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
      <Database className="h-8 w-8 text-muted-foreground" />
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [statuses, setStatuses] = useState<Record<string, Status>>(() =>
    Object.fromEntries(SERVICES.map((service) => [service.name, "checking" as Status])),
  );
  const [metrics, setMetrics] = useState<Record<string, MetricData>>({});
  const [serverRecords, setServerRecords] = useState<ServerRecord[]>(initialServers);
  const [lockedUsers, setLockedUsers] = useState<LockedUser[]>(initialLockedUsers);
  const [selectedServerId, setSelectedServerId] = useState<number | null>(initialServers[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [autoPoll, setAutoPoll] = useState(true);
  const [newServer, setNewServer] = useState({
    name: "gpu-node-05",
    ip: "10.0.1.12",
    cpu: "16",
    memory: "64",
    gpu: "RTX4090",
    group: "GPU-Cluster-B",
  });
  const [maintenanceTarget, setMaintenanceTarget] = useState(initialServers[3]?.name ?? "gpu-node-04");
  const [maintenanceReason, setMaintenanceReason] = useState("정기 점검 및 드라이버 업데이트");

  const fetchServiceData = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all(
      SERVICES.map(async (service) => {
        try {
          const response = await fetch(service.url, { signal: AbortSignal.timeout(2500) });
          if (!response.ok) throw new Error("Response not OK");

          const data = await response.json();
          setStatuses((previous) => ({ ...previous, [service.name]: "up" }));

          if (service.url.endsWith("/metrics")) {
            setMetrics((previous) => ({ ...previous, [service.name]: data as MetricData }));
          }
        } catch {
          setStatuses((previous) => ({ ...previous, [service.name]: "down" }));
        }
      }),
    );
    setLastRefreshed(new Date());
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchServiceData();

    if (!autoPoll) return;

    const interval = setInterval(fetchServiceData, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchServiceData, autoPoll]);

  const selectedServer = useMemo(
    () => serverRecords.find((server) => server.id === selectedServerId) ?? serverRecords[0] ?? null,
    [selectedServerId, serverRecords],
  );

  const groups = useMemo(() => ["전체", ...Array.from(new Set(serverRecords.map((server) => server.group)))], [
    serverRecords,
  ]);

  const filteredServers = useMemo(() => {
    const lowered = query.toLowerCase();
    return serverRecords.filter((server) => {
      const matchesQuery =
        !query ||
        server.name.toLowerCase().includes(lowered) ||
        server.ip.toLowerCase().includes(lowered) ||
        server.group.toLowerCase().includes(lowered);
      const matchesGroup = groupFilter === "전체" || server.group === groupFilter;
      const matchesStatus = statusFilter === "전체" || server.status === statusFilter;
      return matchesQuery && matchesGroup && matchesStatus;
    });
  }, [groupFilter, query, serverRecords, statusFilter]);

  const summary = useMemo(() => {
    const active = serverRecords.filter((server) => server.status === "운영 중").length;
    const maintenance = serverRecords.filter((server) => server.status === "점검 중").length;
    const warnings = serverRecords.filter((server) => server.status === "경고").length;
    const healthValues = serverRecords
      .map((server) => server.health)
      .filter((value): value is number => typeof value === "number");
    const avgHealth = Math.round(
      healthValues.reduce((sum, value) => sum + value, 0) / Math.max(healthValues.length, 1),
    );
    const avgAvailability =
      serverRecords
        .map((server) => server.uptime)
        .filter((value): value is number => typeof value === "number")
        .reduce((sum, value) => sum + value, 0) /
      Math.max(serverRecords.filter((server) => typeof server.uptime === "number").length, 1);

    return {
      total: serverRecords.length,
      active,
      maintenance,
      warnings,
      avgHealth,
      avgAvailability: avgAvailability.toFixed(1),
      connected: Object.values(statuses).filter((status) => status === "up").length,
      disconnected: Object.values(statuses).filter((status) => status === "down").length,
      metricCount: Object.keys(metrics).length,
    };
  }, [metrics, serverRecords, statuses]);

  const addServer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = Math.max(...serverRecords.map((server) => server.id)) + 1;
    const record: ServerRecord = {
      id,
      name: newServer.name,
      group: newServer.group,
      ip: newServer.ip,
      status: "운영 중",
      health: 100,
      cpu: 0,
      memory: 0,
      gpu: newServer.gpu ? 0 : null,
      uptime: 100,
      mtbf: 0,
      mttr: 0,
      lastCheck: "2026-06-12",
    };
    setServerRecords((previous) => [record, ...previous]);
    setSelectedServerId(record.id);
    setActivePage("servers");
  };

  const unlockUser = (id: number) => {
    setLockedUsers((previous) => previous.filter((user) => user.id !== id));
  };

  const addMaintenance = () => {
    setMaintenanceReason(`${maintenanceTarget} 점검 등록 완료`);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-foreground antialiased lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-slate-800 bg-slate-950 text-slate-100 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
          <Menu className="h-5 w-5 text-slate-300" />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">운영 콘솔</div>
            <div className="truncate text-xs text-slate-400">Server Ops</div>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-3 py-3 lg:block lg:space-y-6 lg:overflow-visible lg:px-4 lg:py-5">
          {pageGroups.map((group) => (
            <div key={group.title} className="min-w-44 lg:min-w-0">
              <div className="mb-2 px-3 text-xs font-semibold text-slate-500">{group.title}</div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActivePage(item.key)}
                      className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-white/95 px-5 backdrop-blur lg:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-normal">{pageTitle[activePage]}</h1>
            <div className="mt-1 text-xs text-muted-foreground">
              최근 갱신 {lastRefreshed.toLocaleString()} · 백엔드 {summary.connected}개 연결
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoPoll((value) => !value)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold hover:bg-accent"
            >
              {autoPoll ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span className="hidden sm:inline">{autoPoll ? "자동 새로고침" : "일시 정지"}</span>
            </button>
            <button
              type="button"
              onClick={fetchServiceData}
              disabled={isRefreshing}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">새로고침</span>
            </button>
            <IconButton icon={Bell} label="알림" />
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold hover:bg-accent"
            >
              <UserCog className="h-4 w-4" />
              운영 관리자
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </header>

        <div className="space-y-5 p-5 lg:p-6">
          {activePage === "dashboard" ? (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <KpiCard
                  label="전체 서버"
                  value={`${summary.total}대`}
                  detail={`운영 ${summary.active} · 점검 ${summary.maintenance} · 경고 ${summary.warnings}`}
                  icon={Server}
                />
                <KpiCard
                  label="가용성"
                  value={`${summary.avgAvailability}%`}
                  detail="최근 24시간 기준"
                  icon={Gauge}
                  tone="green"
                />
                <KpiCard
                  label="평균 건강 점수"
                  value={`${summary.avgHealth}점`}
                  detail={`임계 미만 ${summary.warnings}대`}
                  icon={CircleGauge}
                  tone="green"
                />
                <KpiCard label="MTBF 평균" value="352시간" detail="지난 30일 기준" icon={Clock3} tone="blue" />
                <KpiCard label="MTTR 평균" value="1.2시간" detail="지난 30일 기준" icon={Wrench} tone="blue" />
                <KpiCard label="활성 예약" value="12건" detail="사용 중 9 · 대기 3" icon={Database} />
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
                <Panel>
                  <SectionHeader
                    title="서버 현황"
                    count={filteredServers.length}
                    action={
                      <button
                        type="button"
                        onClick={() => setActivePage("register")}
                        className="inline-flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
                      >
                        <Plus className="h-4 w-4" />
                        서버 등록
                      </button>
                    }
                  />
                  <div className="grid gap-3 border-b border-border px-4 py-3 md:grid-cols-[1fr_180px_180px_180px]">
                    <label className="relative">
                      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none ring-ring focus:ring-2"
                        placeholder="서버명, IP 검색"
                      />
                    </label>
                    <select
                      value={groupFilter}
                      onChange={(event) => setGroupFilter(event.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                    >
                      {groups.map((group) => (
                        <option key={group}>{group}</option>
                      ))}
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                    >
                      {["전체", "운영 중", "점검 중", "경고", "종료"].map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold hover:bg-accent"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      정렬 상태
                    </button>
                  </div>
                  <ServerTable
                    servers={filteredServers}
                    selectedId={selectedServer?.id ?? null}
                    onSelect={(server) => {
                      setSelectedServerId(server.id);
                      setActivePage("servers");
                    }}
                  />
                </Panel>

                <div className="space-y-5">
                  <Panel>
                    <SectionHeader title="이상 징후" count={anomalyRows.length} />
                    <div className="divide-y divide-border">
                      {anomalyRows.map((row) => (
                        <div key={`${row.server}-${row.time}`} className="px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <Badge
                                variant={row.level === "위험" ? "destructive" : "secondary"}
                                className="rounded-md font-sans"
                              >
                                {row.level}
                              </Badge>
                              <span className="truncate text-sm font-semibold">{row.server}</span>
                            </div>
                            <span className="font-mono text-xs text-muted-foreground">{row.time}</span>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{row.message}</p>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  <Panel>
                    <SectionHeader title="점검 일정" count={maintenanceRows.length} />
                    <div className="divide-y divide-border">
                      {maintenanceRows.slice(0, 2).map((row) => (
                        <div key={row.server} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold">{row.server}</div>
                              <div className="mt-1 font-mono text-xs text-muted-foreground">{row.date}</div>
                              <div className="mt-1 text-xs text-muted-foreground">{row.reason}</div>
                            </div>
                            <Badge variant="secondary" className="rounded-md font-sans">
                              {row.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  <Panel>
                    <SectionHeader title="최근 스케줄러 작업" />
                    <div className="divide-y divide-border">
                      {schedulerRows.map((row) => (
                        <div key={row.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <span className="truncate text-sm">{row.name}</span>
                          <div className="flex items-center gap-3">
                            <Badge className="rounded-md bg-emerald-100 font-sans text-emerald-700 hover:bg-emerald-100">
                              {row.status}
                            </Badge>
                            <span className="font-mono text-xs text-muted-foreground">{row.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-4">
                <UsageChart title="CPU 사용률 평균" value="31%" change="▼ 6%" dataKey="cpu" color="#2563eb" />
                <UsageChart title="메모리 사용률 평균" value="44%" change="▼ 3%" dataKey="memory" color="#059669" />
                <UsageChart title="GPU 사용률 평균" value="57%" change="▲ 5%" dataKey="gpu" color="#dc2626" />
                <UsageChart title="네트워크 트래픽 평균" value="220 Mbps" change="▼ 8%" dataKey="net" color="#0f766e" />
              </div>
            </>
          ) : null}

          {activePage === "servers" ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Panel>
                <SectionHeader title="서버 목록" count={filteredServers.length} />
                <div className="grid gap-3 border-b border-border px-4 py-3 md:grid-cols-[1fr_180px_180px]">
                  <label className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none ring-ring focus:ring-2"
                      placeholder="서버명, IP, 그룹 검색"
                    />
                  </label>
                  <select
                    value={groupFilter}
                    onChange={(event) => setGroupFilter(event.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                  >
                    {groups.map((group) => (
                      <option key={group}>{group}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                  >
                    {["전체", "운영 중", "점검 중", "경고", "종료"].map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <ServerTable
                  servers={filteredServers}
                  selectedId={selectedServer?.id ?? null}
                  onSelect={(server) => setSelectedServerId(server.id)}
                />
              </Panel>

              <Panel className="self-start">
                <SectionHeader title="서버 상세" />
                {selectedServer ? (
                  <div className="space-y-4 p-4">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-bold">{selectedServer.name}</h2>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">{selectedServer.ip}</p>
                        </div>
                        <ServerStatusBadge status={selectedServer.status} />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-md border border-border p-3">
                          <div className="text-xs text-muted-foreground">건강 점수</div>
                          <div className={`mt-2 font-mono text-2xl font-bold ${getHealthTone(selectedServer.health)}`}>
                            {selectedServer.health ?? "-"}
                          </div>
                        </div>
                        <div className="rounded-md border border-border p-3">
                          <div className="text-xs text-muted-foreground">가동률</div>
                          <div className="mt-2 font-mono text-2xl font-bold">
                            {selectedServer.uptime ? `${selectedServer.uptime}%` : "-"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 text-sm">
                      {[
                        ["그룹", selectedServer.group],
                        ["CPU", formatPercent(selectedServer.cpu)],
                        ["메모리", formatPercent(selectedServer.memory)],
                        ["GPU", formatPercent(selectedServer.gpu)],
                        ["MTBF", selectedServer.mtbf ? `${selectedServer.mtbf}h` : "-"],
                        ["MTTR", selectedServer.mttr ? `${selectedServer.mttr}h` : "-"],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between border-b border-border py-2">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-2">
                      <button
                        type="button"
                        onClick={() => setActivePage("maintenance")}
                        className="h-10 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
                      >
                        점검 등록
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePage("alternatives")}
                        className="h-10 rounded-md border border-border bg-card px-3 text-sm font-semibold hover:bg-accent"
                      >
                        대안 서버 조회
                      </button>
                    </div>
                  </div>
                ) : (
                  <EmptyState title="선택된 서버 없음" description="서버 목록에서 상세 버튼을 눌러 서버를 선택하세요." />
                )}
              </Panel>
            </div>
          ) : null}

          {activePage === "register" ? (
            <div className="grid gap-5 xl:grid-cols-[520px_minmax(0,1fr)]">
              <Panel>
                <SectionHeader title="서버 등록" />
                <form onSubmit={addServer} className="space-y-4 p-4">
                  {[
                    ["서버명", "name", "gpu-node-05"],
                    ["IP 주소", "ip", "10.0.1.12"],
                    ["CPU 코어", "cpu", "16"],
                    ["RAM GB", "memory", "64"],
                    ["GPU 모델", "gpu", "RTX4090"],
                    ["그룹", "group", "GPU-Cluster-B"],
                  ].map(([label, key, placeholder]) => (
                    <label key={key} className="block">
                      <span className="text-sm font-semibold">{label}</span>
                      <input
                        value={newServer[key as keyof typeof newServer]}
                        onChange={(event) =>
                          setNewServer((previous) => ({ ...previous, [key]: event.target.value }))
                        }
                        placeholder={placeholder}
                        className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                      />
                    </label>
                  ))}
                  <button
                    type="submit"
                    className="h-10 w-full rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
                  >
                    서버 등록
                  </button>
                </form>
              </Panel>

              <Panel>
                <SectionHeader title="등록 후 검증 항목" />
                <div className="grid gap-3 p-4 md:grid-cols-2">
                  {[
                    ["이름/IP 중복 검사", "등록 전 동일 서버가 있는지 확인"],
                    ["초기 상태", "startInMaintenance=false이면 운영 중"],
                    ["버전", "생성 시 version=1"],
                    ["목록 반영", "서버 현황과 대안 조회에 즉시 표시"],
                  ].map(([title, detail]) => (
                    <div key={title} className="rounded-md border border-border p-4">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <div className="mt-3 text-sm font-semibold">{title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{detail}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          ) : null}

          {activePage === "alternatives" ? (
            <Panel>
              <SectionHeader title="대안 서버 후보" count={alternativeRows.length} />
              <div className="grid gap-4 p-4 xl:grid-cols-3">
                {alternativeRows.map((row) => (
                  <div key={`${row.source}-${row.name}`} className="rounded-md border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground">{row.source} 대체 후보</div>
                        <div className="mt-1 text-lg font-bold">{row.name}</div>
                      </div>
                      <Badge className="rounded-md bg-emerald-600 font-sans text-white hover:bg-emerald-600">
                        적합도 {row.fit}%
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                      <div className="rounded-md bg-muted p-3">
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                        <div className="mt-2 font-mono font-bold">{row.cpu}</div>
                        <div className="text-xs text-muted-foreground">cores</div>
                      </div>
                      <div className="rounded-md bg-muted p-3">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <div className="mt-2 font-mono font-bold">{row.memory}</div>
                        <div className="text-xs text-muted-foreground">GB</div>
                      </div>
                      <div className="rounded-md bg-muted p-3">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <div className="mt-2 truncate font-mono font-bold">{row.gpu}</div>
                        <div className="text-xs text-muted-foreground">GPU</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mt-4 h-10 w-full rounded-md border border-border bg-card text-sm font-semibold hover:bg-accent"
                    >
                      후보 선택
                    </button>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          {activePage === "availability" ? (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-4">
                <KpiCard label="시스템 가용성" value={`${summary.avgAvailability}%`} detail="전체 서버 평균" icon={Gauge} tone="green" />
                <KpiCard label="평균 MTBF" value="352h" detail="최근 30일" icon={Clock3} tone="blue" />
                <KpiCard label="평균 MTTR" value="1.2h" detail="최근 30일" icon={Wrench} tone="blue" />
                <KpiCard label="위험 배지" value={`${summary.warnings}대`} detail="가용성 저하 서버" icon={ShieldAlert} tone="red" />
              </div>
              <Panel className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">가용성 추이</h2>
                  <Badge variant="secondary" className="rounded-md font-sans">
                    24시간
                  </Badge>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usageTrend} margin={{ top: 12, right: 16, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[94, 100]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      />
                      <Line type="monotone" dataKey="availability" stroke="#059669" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>
          ) : null}

          {activePage === "maintenance" ? (
            <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
              <Panel>
                <SectionHeader title="점검 등록" />
                <div className="space-y-4 p-4">
                  <label className="block">
                    <span className="text-sm font-semibold">대상 서버</span>
                    <select
                      value={maintenanceTarget}
                      onChange={(event) => setMaintenanceTarget(event.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                    >
                      {serverRecords.map((server) => (
                        <option key={server.id}>{server.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold">사유</span>
                    <textarea
                      value={maintenanceReason}
                      onChange={(event) => setMaintenanceReason(event.target.value)}
                      className="mt-2 min-h-28 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="datetime-local"
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                      defaultValue="2026-06-13T02:00"
                    />
                    <input
                      type="datetime-local"
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                      defaultValue="2026-06-13T04:00"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addMaintenance}
                    className="h-10 w-full rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
                  >
                    점검 등록
                  </button>
                </div>
              </Panel>

              <Panel>
                <SectionHeader title="점검 일정 목록" count={maintenanceRows.length} />
                <div className="divide-y divide-border">
                  {maintenanceRows.map((row) => (
                    <div key={row.server} className="grid gap-3 px-4 py-4 md:grid-cols-[160px_1fr_80px] md:items-center">
                      <div className="font-semibold">{row.server}</div>
                      <div>
                        <div className="font-mono text-sm">{row.date}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{row.reason}</div>
                      </div>
                      <Badge variant="secondary" className="justify-center rounded-md font-sans">
                        {row.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          ) : null}

          {activePage === "usage" ? (
            <div className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-4">
                <UsageChart title="CPU 사용률" value="31%" change="▼ 6%" dataKey="cpu" color="#2563eb" />
                <UsageChart title="메모리 사용률" value="44%" change="▼ 3%" dataKey="memory" color="#059669" />
                <UsageChart title="GPU 사용률" value="57%" change="▲ 5%" dataKey="gpu" color="#dc2626" />
                <UsageChart title="네트워크" value="220 Mbps" change="▼ 8%" dataKey="net" color="#0f766e" />
              </div>
              <Panel>
                <SectionHeader title="수집 대상 서비스" count={SERVICES.length} />
                <div className="divide-y divide-border">
                  {SERVICES.map((service) => (
                    <div key={service.name} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_120px_180px] md:items-center">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{service.name}</div>
                        <div className="mt-1 truncate font-mono text-xs text-muted-foreground">{service.url}</div>
                      </div>
                      <StatusBadge status={statuses[service.name]} />
                      <div className="text-sm text-muted-foreground">
                        {metrics[service.name] ? "메트릭 수신" : "수집 대기"}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          ) : null}

          {activePage === "accounts" ? (
            <Panel>
              <SectionHeader title="잠금 계정" count={lockedUsers.length} />
              {lockedUsers.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                        <th className="px-4 py-3">계정</th>
                        <th className="px-3 py-3">역할</th>
                        <th className="px-3 py-3">사유</th>
                        <th className="px-3 py-3">요청 수</th>
                        <th className="px-3 py-3">잠금 해제 예정</th>
                        <th className="px-4 py-3">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {lockedUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-3 font-semibold">{user.name}</td>
                          <td className="px-3 py-3">{user.role}</td>
                          <td className="px-3 py-3 text-muted-foreground">{user.reason}</td>
                          <td className="px-3 py-3 font-mono">{user.requests}</td>
                          <td className="px-3 py-3 font-mono">{user.lockedUntil}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => unlockUser(user.id)}
                              className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold hover:bg-accent"
                            >
                              <Unlock className="h-3.5 w-3.5" />
                              잠금 해제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="잠금 계정 없음" description="현재 운영자가 해제해야 할 잠금 계정이 없습니다." />
              )}
            </Panel>
          ) : null}

          {activePage === "alerts" ? (
            <Panel>
              <SectionHeader title="알림 목록" count={anomalyRows.length + maintenanceRows.length} />
              <div className="divide-y divide-border">
                {[...anomalyRows, ...maintenanceRows].map((row, index) => (
                  <div key={index} className="flex items-start gap-3 px-4 py-4">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{"message" in row ? row.server : row.server}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {"message" in row ? row.message : row.reason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          {activePage === "audit" ? (
            <Panel>
              <SectionHeader title="감사 로그" count={auditRows.length} />
              <div className="divide-y divide-border">
                {auditRows.map((row) => (
                  <div key={`${row.action}-${row.time}`} className="grid gap-3 px-4 py-4 md:grid-cols-[160px_180px_1fr_120px]">
                    <div className="font-semibold">{row.actor}</div>
                    <div>{row.action}</div>
                    <div className="text-muted-foreground">{row.target}</div>
                    <div className="font-mono text-xs text-muted-foreground">{row.time}</div>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}
        </div>
      </main>
    </div>
  );
}
