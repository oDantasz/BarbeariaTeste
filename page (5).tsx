import type { Metadata } from "next";
import { getCatalog } from "@/lib/data";
import { SiteHeader } from "@/components/site-header";
import { DemoBanner } from "@/components/demo-banner";
import { MyBookings } from "@/components/booking/my-bookings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Meus horários", robots: { index: false } };

export default async function MeusHorarios() {
  const cat = await getCatalog();
  const unit = cat.units[0];
  return (
    <>
      <DemoBanner />
      <SiteHeader units={cat.units} unitId={unit.id} bookHref={`/agendar?unidade=${unit.id}`} />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-semiwide text-4xl font-[850] tracking-tight">Meus horários</h1>
        <p className="mb-8 mt-1 text-ink-2">Horários marcados neste celular ou computador.</p>
        <MyBookings
          units={Object.fromEntries(cat.units.map((u) => [u.id, u.name]))}
          pros={Object.fromEntries(cat.pros.map((p) => [p.id, p.name]))}
          bookHref={`/agendar?unidade=${unit.id}`}
        />
      </main>
    </>
  );
}
