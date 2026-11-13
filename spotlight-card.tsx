"use client";
// Cartão com brilho que segue o ponteiro.
// Inspirado no padrão "Spotlight Card" da comunidade 21st.dev, reescrito com as cores da barbearia.
import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLDivElement> & { glow?: string };

export function SpotlightCard({ className, glow = "rgba(11,99,160,.14)", children, style, ...props }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${e.clientX - r.left}px`);
    el.style.setProperty("--sy", `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      style={{ ...style, ["--glow" as string]: glow }}
      className={cn(
        "group/spot relative isolate overflow-hidden rounded-xl border border-grout bg-surface",
        "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:opacity-0 before:transition-opacity before:duration-300",
        "before:bg-[radial-gradient(420px_circle_at_var(--sx,50%)_var(--sy,0%),var(--glow),transparent_60%)]",
        "hover:before:opacity-100",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
