"use client";
// Abas com indicador "limelight": uma luz que desliza até a aba ativa.
// Inspirado no componente "Limelight Nav" da comunidade 21st.dev, reescrito para abas acessíveis.
import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type TabItem = { id: string; label: string; count?: number };

export function LimelightTabs({
  items, value, onChange, label, className,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}) {
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = items[(i + d + items.length) % items.length];
    onChange(next.id);
    refs.current[next.id]?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("relative flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
    >
      {items.map((t, i) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => { refs.current[t.id] = el; }}
            role="tab"
            id={`tab-${t.id}`}
            aria-controls={`painel-${t.id}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "relative flex h-14 shrink-0 items-center gap-2 px-4 text-[0.98rem] font-semibold transition-colors",
              active ? "text-ink" : "text-ink-2 hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={`limelight-${label}`}
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
                className="pointer-events-none absolute inset-x-1 top-0 h-full"
                aria-hidden
              >
                <span className="absolute inset-x-3 top-0 h-[3px] rounded-b-full bg-leather shadow-[0_0_14px_2px_rgba(124,29,42,.45)]" />
                <span className="absolute inset-x-0 top-[3px] h-[70%] bg-[linear-gradient(to_bottom,rgba(124,29,42,.13),transparent)] [clip-path:polygon(12%_0,88%_0,100%_100%,0_100%)]" />
              </motion.span>
            )}
            <span className={cn("relative", active && "font-extrabold")}>{t.label}</span>
            {t.count != null && (
              <span className="relative rounded-full bg-surface px-2 text-xs font-bold text-ink-2 tabular">{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
