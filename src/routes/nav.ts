import type { Role } from "@/types/api";

export interface NavItem {
  to: string;
  label: string;
  icon: string;
}

export interface NavGroup {
  title: string;
  roles: Role[];
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "운영",
    roles: ["STU", "MGR", "ADM"],
    items: [
      { to: "/", label: "대시보드", icon: "▦" },
      { to: "/servers", label: "서버 현황", icon: "▤" },
      { to: "/reservations", label: "내 예약", icon: "◷" },
      { to: "/alerts", label: "알림", icon: "◔" },
    ],
  },
  {
    title: "팀 관리",
    roles: ["MGR", "ADM"],
    items: [
      { to: "/approvals", label: "승인함", icon: "✓" },
      { to: "/quota", label: "Quota 관리", icon: "▣" },
      { to: "/team-usage", label: "팀 사용 현황", icon: "▥" },
    ],
  },
  {
    title: "서버 운영",
    roles: ["ADM"],
    items: [
      { to: "/ops", label: "운영 대시보드", icon: "▥" },
      { to: "/ops/availability", label: "가용성", icon: "◴" },
      { to: "/ops/aiops", label: "AIOps", icon: "◵" },
      { to: "/admin/servers", label: "서버 관리", icon: "▧" },
      { to: "/admin/accounts", label: "계정 잠금", icon: "⚿" },
    ],
  },
];

export function groupsForRole(role: Role): NavGroup[] {
  return NAV_GROUPS.filter((group) => group.roles.includes(role));
}
