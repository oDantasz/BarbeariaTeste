import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCatalog, getStaff, isDemo, listBookings } from "@/lib/data";
import { addDays, localParts, localToISO, todayLocal } from "@/lib/time";
import { PainelView } from "@/components/painel/painel-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel", robots: { index: false } };

export default async function PainelPage({ searchParams }: { searchParams: Promise<{ dia?: string; unidade?: string }> }) {
  const staff = await getStaff();
  if (!staff) redirect("/painel/entrar");
  const sp = await searchParams;
  const day = /^\d{4}-\d{2}-\d{2}$/.test(sp.dia ?? "") ? sp.dia! : todayLocal();
  const [cat, bookings, week] = await Promise.all([
    getCatalog(),
    listBookings(localToISO(day, 0), localToISO(addDays(day, 1), 0)),
    listBookings(localToISO(day, 0), localToISO(addDays(day, 7), 0)),
  ]);
  const units = staff.role === "owner" ? cat.units : cat.units.filter((u) => staff.proId && u.pros.includes(staff.proId));
  const unitId = units.some((u) => u.id === sp.unidade) ? sp.unidade! : "all";

  return (
    <PainelView
      staff={staff}
      demo={isDemo}
      day={day}
      unitId={unitId}
      catalog={{ ...cat, units }}
      bookings={bookings}
      weekCounts={Object.fromEntries(
        Array.from({ length: 7 }, (_, i) => addDays(day, i)).map((d) => [
          d,
          week.filter((b) => b.status !== "cancelled" && localParts(b.startsAt).date === d).length,
        ]),
      )}
    />
  );
}
