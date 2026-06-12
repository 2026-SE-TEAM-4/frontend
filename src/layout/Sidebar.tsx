import { NavLink } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import { groupsForRole } from "@/routes/nav";

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;
  const groups = groupsForRole(user.role);

  return (
    <aside className="sticky top-[52px] h-[calc(100vh-52px)] w-[212px] flex-none overflow-auto border-r border-[var(--bd)] bg-[var(--bg)] px-3 py-3.5">
      {groups.map((group) => (
        <div key={group.title} className="mb-1">
          <div className="px-2.5 pb-1.5 pt-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--mut)]">
            {group.title}
          </div>
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `mb-px flex items-center gap-2.5 rounded-[7px] px-2.5 py-[7px] text-[13.5px] font-medium ${
                  isActive
                    ? "bg-[var(--accs)] font-semibold text-[var(--acct)]"
                    : "text-[var(--text2)] hover:bg-[var(--soft)]"
                }`
              }
            >
              <span className="w-4 text-center text-[13px] text-[var(--mut)]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
      <div className="mt-3.5 rounded-lg border border-[var(--bd2)] bg-[var(--soft)] p-2.5 text-[11px] leading-relaxed text-[var(--mut)]">
        <b className="text-[var(--text2)]">설계 추적 모드</b>
        <br />각 화면의 API·기능(F)·UC·엔티티를 상단 추적 바에 표기합니다.
      </div>
    </aside>
  );
}
