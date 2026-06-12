import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/Segmented";
import { apiFetch, ApiError } from "@/lib/api";
import type { Role, TeamListResponse, Team } from "@/types/api";

const ROLE_OPTS: { value: Role; label: string; sub: string }[] = [
  { value: "STU", label: "학생·연구원", sub: "STU" },
  { value: "MGR", label: "팀 관리자", sub: "MGR" },
  { value: "ADM", label: "서버 관리자", sub: "ADM" },
];

export function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("STU");
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch<TeamListResponse>("/teams")
      .then((res) => {
        setTeams(res.teams);
        if (res.teams[0]) setTeamId(res.teams[0].id);
      })
      .catch(() => setError("팀 목록을 불러오지 못했습니다. 백엔드가 켜져 있는지 확인하세요."));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (teamId === null) {
      setError("소속 팀을 선택하세요.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role, teamId }),
      });
      setDone(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 409
            ? "이미 가입된 이메일입니다."
            : err.status === 422
              ? "존재하지 않는 팀이거나 입력값이 올바르지 않습니다."
              : err.message
          : "회원가입에 실패했습니다.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#eef0f3] p-7">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[440px] rounded-xl border border-[var(--bd)] bg-[var(--bg)] px-[26px] py-7 shadow-[0_6px_24px_rgba(20,30,50,.07)]"
      >
        <div className="mb-3.5 flex items-center justify-center gap-2 text-[15px] font-bold">
          <span className="grid h-6 w-6 place-items-center rounded-[7px] bg-[var(--text)] text-[12px] font-extrabold text-white">
            SH
          </span>
          ServerHub
        </div>
        <h1 className="mb-[18px] text-center text-[18px] font-bold">회원가입</h1>

        <div className="grid grid-cols-2 gap-x-3.5">
          <Field label="이름" htmlFor="name">
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" required />
          </Field>
          <Field label="소속 팀" htmlFor="team">
            <select
              id="team"
              value={teamId ?? ""}
              onChange={(e) => setTeamId(Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--bd)] bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-[var(--acc)]"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="이메일" htmlFor="email">
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@lab.ac.kr" required />
        </Field>
        <Field label="비밀번호 (8자 이상)" htmlFor="password">
          <Input id="password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </Field>
        <Field label="역할" htmlFor="role">
          <Segmented ariaLabel="역할" options={ROLE_OPTS} value={role} onChange={setRole} />
        </Field>

        <div className="my-1 mb-4">
          <Notice tone="warn">🎓 과제 데모용: 역할을 직접 지정합니다. 실서비스라면 관리자 승인이 필요한 부분입니다.</Notice>
        </div>

        {error && (
          <div className="mb-3.5">
            <Notice tone="error">⚠ {error}</Notice>
          </div>
        )}
        {done && (
          <div className="mb-3.5">
            <Notice tone="success">가입 완료. 로그인 화면으로 이동합니다…</Notice>
          </div>
        )}

        <Button type="submit" variant="pri" className="w-full py-2.5" disabled={busy || done}>
          {busy ? "처리 중…" : "가입하기"}
        </Button>
        <p className="mt-4 text-center text-[12.5px] text-[var(--mut)]">
          이미 계정이 있나요?{" "}
          <Link to="/login" className="font-semibold text-[var(--acc)]">
            로그인
          </Link>
        </p>
      </form>
    </div>
  );
}
