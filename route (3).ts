import { NextResponse } from "next/server";
import { getBusy, getCatalog } from "@/lib/data";
import { computeSlots } from "@/lib/slots";
import { blockDur } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const unitId = q.get("unit") ?? "";
  const date = q.get("date") ?? "";
  const pro = q.get("pro") || "any";
  const ids = (q.get("services") ?? "").split(",").map(Number).filter(Boolean);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "data_invalida" }, { status: 400 });

  const cat = await getCatalog();
  const unit = cat.units.find((u) => u.id === unitId);
  if (!unit) return NextResponse.json({ error: "unidade_invalida" }, { status: 400 });
  const minutes = ids.reduce((a, id) => a + (cat.services.find((s) => s.id === id)?.dur ?? 0), 0) || 30;
  const duration = blockDur(minutes);
  const busy = await getBusy(unit.id, date);
  const slots = computeSlots({ unit, date, duration, proId: pro, busy });
  return NextResponse.json({ date, duration, slots }, { headers: { "Cache-Control": "no-store" } });
}
