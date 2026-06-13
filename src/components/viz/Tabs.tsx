import { useState } from "react";
import type { ReactNode } from "react";

interface TabDef {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: TabDef[];
  // 제어형: value+onChange 둘 다 주면 부모가 활성 탭을 소유한다.
  value?: string;
  onChange?: (key: string) => void;
  // 비제어형: defaultValue만 주면 내부 state로 관리한다.
  defaultValue?: string;
  // 각 탭 key에 대응하는 내용. 활성 탭의 노드만 렌더한다.
  children: Partial<Record<string, ReactNode>>;
}

function TabBar({
  tabs,
  active,
  onSelect,
}: {
  tabs: TabDef[];
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="inline-flex rounded-[7px] border border-[var(--g-bd)] bg-[var(--g-pan2)] p-0.5">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelect(t.key)}
            aria-pressed={isActive}
            className="rounded-[5px] px-3 py-1 text-[13px] font-semibold"
            style={{
              background: isActive ? "var(--g-pan)" : "transparent",
              color: isActive ? "var(--g-tx)" : "var(--g-mut)",
              boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.12)" : "none",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, defaultValue, children }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.key ?? "");
  const isControlled = value !== undefined;
  const active = isControlled ? value : internal;

  const select = (key: string) => {
    if (!isControlled) setInternal(key);
    onChange?.(key);
  };

  return (
    <div>
      <TabBar tabs={tabs} active={active} onSelect={select} />
      <div className="mt-3">{children[active]}</div>
    </div>
  );
}
