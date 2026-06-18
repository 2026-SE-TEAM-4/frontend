import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

// 데모 로그인은 개발/시연 빌드에서만 노출한다. 프로덕션 빌드에서는
// import.meta.env.DEV 가 false 로 치환되어 버튼·비밀번호 문자열이 번들에서 제거된다.
const DEMO_PASSWORD = import.meta.env.DEV ? "password123" : "";

const DEMO_ACCOUNTS: { role: string; email: string }[] = import.meta.env.DEV
  ? [
      { role: "STU", email: "hong@example.com" },
      { role: "MGR", email: "kim@example.com" },
      { role: "ADM", email: "admin@example.com" },
    ]
  : [];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runLogin(loginEmail: string, loginPassword: string) {
    setError(null);
    setBusy(true);
    try {
      await login(loginEmail, loginPassword);
      navigate("/", { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 429
            ? "로그인 시도가 많아 계정이 일시 잠겼습니다. 잠시 후 다시 시도하세요."
            : err.message
          : "로그인에 실패했습니다.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await runLogin(email, password);
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#eef0f3] p-7">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[380px] rounded-xl border border-[var(--bd)] bg-[var(--bg)] px-[30px] py-[34px] shadow-[0_6px_24px_rgba(20,30,50,.07)]"
      >
        <div className="mb-1.5 flex items-center justify-center gap-2 text-[15px] font-bold">
          <span className="grid h-6 w-6 place-items-center rounded-[7px] bg-[var(--text)] text-[12px] font-extrabold text-white">
            SH
          </span>
          ServerHub
        </div>
        <h1 className="mt-3.5 text-center text-[18px] font-bold">로그인</h1>
        <p className="mb-5 text-center text-[12.5px] text-[var(--mut)]">서버 예약·할당 관리 시스템</p>

        <Field label="이메일" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@lab.ac.kr"
            required
          />
        </Field>
        <Field label="비밀번호" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </Field>

        {error && (
          <div className="mb-3.5">
            <Notice tone="error">⚠ {error}</Notice>
          </div>
        )}

        <Button type="submit" variant="pri" className="w-full py-2.5" disabled={busy}>
          {busy ? "확인 중…" : "로그인"}
        </Button>

        {import.meta.env.DEV && (
          <div className="mt-5 border-t border-dashed border-[var(--bd)] pt-4">
            <p className="mb-2 text-center text-[11.5px] font-semibold text-[var(--mut)]">
              데모 로그인 (과제 시연용)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <Button
                  key={acc.role}
                  type="button"
                  variant="outline"
                  className="py-2 text-[12px]"
                  disabled={busy}
                  onClick={() => runLogin(acc.email, DEMO_PASSWORD)}
                >
                  {acc.role}
                </Button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-center text-[12.5px] text-[var(--mut)]">
          계정이 없나요?{" "}
          <Link to="/signup" className="font-semibold text-[var(--acc)]">
            회원가입
          </Link>
        </p>
      </form>
    </div>
  );
}
