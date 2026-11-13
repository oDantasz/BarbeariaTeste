import { NextResponse } from "next/server";
import { createBooking } from "@/lib/data";
import { BookingError } from "@/lib/types";
import { localToISO } from "@/lib/time";
import { messageFor } from "@/lib/messages";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "erro", message: messageFor("erro") }, { status: 400 });
  }
  const date = String(body.date ?? "");
  const min = Number(body.min);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(min)) {
    return NextResponse.json({ error: "horario_invalido", message: messageFor("horario_invalido") }, { status: 400 });
  }
  try {
    const r = await createBooking({
      unitId: String(body.unitId ?? ""),
      proId: body.proId && body.proId !== "any" ? String(body.proId) : null,
      startsAt: localToISO(date, min),
      serviceIds: Array.isArray(body.serviceIds) ? body.serviceIds.map(Number).slice(0, 10) : [],
      name: String(body.name ?? "").slice(0, 80),
      phone: String(body.phone ?? "").slice(0, 20),
      notes: String(body.notes ?? "").slice(0, 300),
      source: "site",
    });
    return NextResponse.json(r, { status: 201 });
  } catch (e) {
    const code = e instanceof BookingError ? e.code : "erro";
    if (code === "erro") console.error(e);
    return NextResponse.json({ error: code, message: messageFor(code) }, { status: code === "horario_ocupado" ? 409 : 400 });
  }
}
