import type { Metadata } from "next";
import { getCatalog } from "@/lib/data";
import { BookingFlow } from "@/components/booking/booking-flow";
import { DemoBanner } from "@/components/demo-banner";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Agendar horário" };

type SP = { unidade?: string; servico?: string; profissional?: string; data?: string };

export default async function AgendarPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const cat = await getCatalog();
  const unit = cat.units.find((u) => u.id === sp.unidade) ?? cat.units[0];
  const service = cat.services.find((s) => String(s.id) === sp.servico);
  const pro = unit.pros.includes(sp.profissional ?? "") ? sp.profissional! : null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.data ?? "") ? sp.data! : null;

  return (
    <>
      <DemoBanner />
      <BookingFlow
        catalog={cat}
        initial={{ unitId: unit.id, serviceIds: service ? [service.id] : [], proId: pro, date, fromLink: Boolean(sp.unidade) }}
      />
    </>
  );
}
