import { cn } from "@/lib/utils";

// Poste de barbeiro em CSS: cápsulas cromadas, tubo de vidro e listras girando.
const STRIPES =
  "repeating-linear-gradient(-35deg, var(--color-blue) 0 18px, #fff 18px 30px, var(--color-leather) 30px 48px, #fff 48px 60px)";
const CHROME =
  "linear-gradient(90deg,#4a5661 0%,#9fabb4 14%,#f4f7f9 34%,#ffffff 42%,#b8c3cb 62%,#7a8792 82%,#3b4650 100%)";

export function BarberPole({ className, size = "lg" }: { className?: string; size?: "sm" | "lg" }) {
  const lg = size === "lg";
  return (
    <div
      role="img"
      aria-label="Poste de barbeiro girando"
      className={cn("relative flex flex-col items-center", className)}
    >
      {/* esfera */}
      <div
        className={cn("rounded-full", lg ? "size-14" : "size-7")}
        style={{ background: "radial-gradient(circle at 34% 30%,#fff 0%,#e3e9ed 22%,#9aa7b1 55%,#4c5863 80%,#2a333b 100%)" }}
      />
      <div className={cn(lg ? "-mt-1 h-4 w-10" : "-mt-0.5 h-2 w-5")} style={{ background: CHROME }} />
      <div className={cn("rounded-[6px]", lg ? "h-7 w-[104px]" : "h-3.5 w-[52px]")} style={{ background: CHROME }} />
      {/* tubo */}
      <div
        className={cn(
          "relative overflow-hidden border-x-2 border-[#c9d3da]",
          lg ? "h-[340px] w-[88px]" : "h-[150px] w-[44px]",
        )}
      >
        <div
          className={cn("absolute inset-0", lg ? "animate-pole" : "animate-pole")}
          style={{ backgroundImage: STRIPES, backgroundSize: "104.6px 73.24px", ["--pole-period" as string]: "73.24px" }}
        />
        {/* sombreamento cilíndrico + reflexo do vidro */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg,rgba(20,32,51,.55) 0%,rgba(20,32,51,.08) 22%,rgba(255,255,255,.55) 34%,rgba(255,255,255,0) 46%,rgba(20,32,51,.12) 70%,rgba(20,32,51,.6) 100%)",
          }}
        />
        <div className="absolute inset-y-0 left-[30%] w-[6%] bg-white/50 blur-[1px]" />
      </div>
      <div className={cn("rounded-[6px]", lg ? "h-7 w-[104px]" : "h-3.5 w-[52px]")} style={{ background: CHROME }} />
      <div className={cn(lg ? "h-5 w-12" : "h-2.5 w-6")} style={{ background: CHROME, clipPath: "polygon(0 0,100% 0,78% 100%,22% 100%)" }} />
      {/* sombra no chão */}
      <div className={cn("rounded-[50%] bg-ink/25 blur-md", lg ? "mt-3 h-4 w-28" : "mt-1 h-2 w-12")} />
    </div>
  );
}

export function PoleMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-8 w-3 rounded-full bg-pole ring-2 ring-ink", className)}
      style={{ backgroundSize: "45.25px 45.25px" }}
    />
  );
}
