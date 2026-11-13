import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { BarberPole } from "../barber-pole";
import { Button } from "../ui/button";
import { relativeDay, toHHMM } from "@/lib/time";
import type { Slot, Unit } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Hero({
  unit, status, free, proNames,
}: {
  unit: Unit;
  status: { open: boolean; text: string };
  free: { date: string; slots: Slot[] } | null;
  proNames: Record<string, string>;
}) {
  const book = `/agendar?unidade=${unit.id}`;
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-grout">
      <div
        aria-hidden
        className="absolute inset-0 bg-tiles [mask-image:radial-gradient(ellipse_75%_70%_at_70%_40%,#000_30%,transparent_80%)]"
      />
      <div aria-hidden className="absolute right-[-10%] top-[-20%] size-[620px] rounded-full bg-[radial-gradient(circle,rgba(11,99,160,.16),transparent_62%)]" />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-12 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center lg:pb-20 lg:pt-16">
        <div>
          <ul className="flex flex-wrap gap-2 text-[0.94rem] font-semibold">
            <li className="flex items-center gap-1.5 rounded-full border border-grout bg-surface/90 px-3 py-1.5">
              <MapPin className="size-4 text-blue" aria-hidden />
              {unit.name}
              {unit.cep && <span className="font-normal text-ink-2">{unit.area}</span>}
            </li>
            <li className="flex items-center gap-1.5 rounded-full border border-grout bg-surface/90 px-3 py-1.5">
              <span className="flex text-[#B7791F]" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-3.5 fill-current" strokeWidth={0} />)}
              </span>
              <span className="tabular">{unit.rating.toFixed(1).replace(".", ",")}</span>
              <span className="sr-only">de 5 estrelas</span>
            </li>
            <li className="flex items-center gap-2 rounded-full border border-grout bg-surface/90 px-3 py-1.5">
              <span className={cn("size-2 rounded-full", status.open ? "bg-ok shadow-[0_0_0_4px_rgba(28,115,67,.15)]" : "bg-danger")} aria-hidden />
              {status.text}
            </li>
          </ul>

          <div className="mt-6 flex items-end justify-between gap-6">
            <h1
              id="hero-title"
              className="max-w-[12ch] text-balance font-wide text-[clamp(2.6rem,9vw,5.6rem)] font-[850] leading-[0.92] tracking-[-0.03em]"
            >
              Barbearia do Nálio
            </h1>
            <BarberPole size="sm" className="hidden shrink-0 sm:flex lg:hidden" />
          </div>
          <p className="mt-5 max-w-[46ch] text-[1.0625rem] leading-relaxed text-ink-2">
            Corte, barba e tratamentos em São Bernardo do Campo. Escolha o serviço, o profissional e o horário em menos de um minuto.
          </p>

          <div className="relative mt-8 max-w-xl overflow-hidden rounded-2xl border border-grout bg-surface p-5 pl-7 shadow-[0_24px_48px_-28px_rgba(20,32,51,.35)]">
            <span aria-hidden className="absolute inset-y-0 left-0 w-2 bg-pole-x animate-pole [--pole-period:45.25px]" />
            {free ? (
              <>
                <h2 className="text-[0.95rem] font-semibold text-ink-2">
                  Horários livres <span className="text-ink">{relativeDay(free.date).toLowerCase()}</span>
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {free.slots.map((s) => (
                    <li key={s.min}>
                      <Link
                        href={`${book}&data=${free.date}`}
                        className="flex h-11 items-center rounded-lg border-2 border-grout px-3.5 font-bold tabular transition-colors hover:border-blue hover:bg-blue-tint"
                        aria-label={`${toHHMM(s.min)} com ${proNames[s.proId] ?? "um profissional"}`}
                      >
                        {toHHMM(s.min)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="font-semibold">Agenda cheia nos próximos dias. Fale com a gente pelo WhatsApp.</p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" id="hero-cta">
                <Link href={book}>Agendar horário</Link>
              </Button>
              <span className="text-sm text-ink-2">Pagamento na barbearia</span>
            </div>
          </div>
        </div>

        <div className="hidden justify-center lg:flex">
          <BarberPole />
        </div>
      </div>
    </section>
  );
}
