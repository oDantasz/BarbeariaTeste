import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBooking, getCatalog } from "@/lib/data";
import { brl, localParts, longDate, toHHMM } from "@/lib/time";
import { SiteHeader } from "@/components/site-header";
import { DemoBanner } from "@/components/demo-banner";
import { TicketActions } from "@/components/booking/ticket-actions";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Seu horário", robots: { index: false } };

const STATUS: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "Confirmado", cls: "bg-ok-tint text-ok" },
  done: { label: "Concluído", cls: "bg-blue-tint text-blue-ink" },
  no_show: { label: "Não compareceu", cls: "bg-warn-tint text-warn" },
  cancelled: { label: "Cancelado", cls: "bg-danger-tint text-danger" },
};

export default async function BookingPage({
  params, searchParams,
}: { params: Promise<{ token: string }>; searchParams: Promise<{ novo?: string }> }) {
  const { token } = await params;
  const { novo } = await searchParams;
  const [b, cat] = await Promise.all([getBooking(token), getCatalog()]);
  if (!b) notFound();
  const unit = cat.units.find((u) => u.id === b.unitId) ?? cat.units[0];
  const pro = cat.pros.find((p) => p.id === b.proId);
  const { date, min } = localParts(b.startsAt);
  const st = STATUS[b.status];
  const fresh = novo === "1" && b.status === "confirmed";
  const future = Date.parse(b.startsAt) > Date.now();

  return (
    <>
      <DemoBanner />
      <SiteHeader units={cat.units} unitId={unit.id} bookHref={`/agendar?unidade=${unit.id}`} />
      <main className="mx-auto max-w-xl px-4 py-10">
        <article className="overflow-hidden rounded-2xl border-2 border-ink bg-surface shadow-[0_30px_60px_-30px_rgba(20,32,51,.45)]">
          <div aria-hidden className="h-4 bg-pole-x animate-pole [--pole-period:45.25px]" />
          <div className="p-6 sm:p-8">
            {fresh ? (
              <p className="flex items-center gap-2 font-extrabold text-ok">
                <span className="grid size-7 place-items-center rounded-full bg-ok text-white"><Check className="size-4" strokeWidth={3} aria-hidden /></span>
                Agendado, {b.customerName.split(" ")[0]}
              </p>
            ) : (
              <span className={cn("inline-block rounded-full px-3 py-1 text-sm font-bold", st.cls)}>{st.label}</span>
            )}
            <h1 className={cn("mt-4 font-wide text-[clamp(1.9rem,7vw,2.6rem)] font-[850] leading-[1.02] tracking-tight", b.status === "cancelled" && "text-ink-2 line-through decoration-2")}>
              {longDate(date)},<br />às <span className="tabular">{toHHMM(min)}</span>
            </h1>
            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 border-t-2 border-dashed border-grout pt-6 text-[0.98rem]">
              <dt className="text-ink-2">Onde</dt>
              <dd className="font-semibold">{unit.name}<br /><span className="font-normal">{unit.street}</span></dd>
              <dt className="text-ink-2">Com</dt>
              <dd className="font-semibold">{pro?.name ?? "Profissional"}</dd>
              <dt className="text-ink-2">Serviços</dt>
              <dd className="font-semibold">{b.services.map((s) => s.name).join(", ")}</dd>
              <dt className="text-ink-2">Total</dt>
              <dd className="font-semibold tabular">{brl(b.totalCents)}</dd>
              <dt className="text-ink-2">Pagamento</dt>
              <dd className="font-semibold">Na barbearia: PIX, cartão ou dinheiro</dd>
            </dl>
          </div>
        </article>

        <TicketActions
          booking={b}
          canCancel={b.status === "confirmed" && future}
          unit={{ name: unit.name, street: unit.street, city: unit.city, whatsapp: unit.whatsapp, id: unit.id }}
          proName={pro?.name ?? ""}
          when={`${longDate(date)}, às ${toHHMM(min)}`}
        />

        <p className="mt-8 text-center text-sm text-ink-2">
          Guarde este link: é por ele que você consulta ou cancela o horário.{" "}
          <Link className="font-semibold text-blue-ink underline underline-offset-4" href="/meus-horarios">Ver meus horários</Link>
        </p>
      </main>
    </>
  );
}
