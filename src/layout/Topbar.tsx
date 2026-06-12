import { useNavigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

const ROLE_LABEL: Record<string, string> = { STU: "학생·연구원", MGR: "팀 관리자", ADM: "서버 관리자" };

export function Topbar({ unread = 0 }: { unread?: number }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const initials = user.name.slice(0, 2);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex h-[52px] items-center gap-3.5 border-b border-[var(--bd)] bg-[var(--bg)] px-[18px]">
      <div className="flex items-center gap-2 text-[15px] font-bold">
        <span className="grid h-[22px] w-[22px] place-items-center rounded-md bg-[var(--text)] text-[12px] font-extrabold text-white">
          SH
        </span>
        ServerHub
      </div>
      <div className="flex-1" />
      {unread > 0 && (
        <span className="rounded-full bg-[var(--dng)] px-2 py-0.5 font-mono text-[11px] font-bold text-white">
          알림 {unread}
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[var(--accs)] text-[12px] font-bold text-[var(--acct)]">
          {initials}
        </span>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold">
            {user.name}{" "}
            <span className="ml-0.5 rounded bg-[var(--oks)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0f5132]">
              {user.role}
            </span>
          </div>
          <div className="text-[11px] text-[var(--mut)]">{ROLE_LABEL[user.role]}</div>
        </div>
        <button
          onClick={handleLogout}
          className="ml-1.5 cursor-pointer rounded-[7px] border border-[var(--bd)] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[var(--text2)] hover:bg-[var(--soft)]"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
