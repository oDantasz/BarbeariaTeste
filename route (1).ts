import { NextResponse } from "next/server";
import { getBooking } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const b = await getBooking(token);
  if (!b) return NextResponse.json({ error: "nao_encontrado" }, { status: 404 });
  return NextResponse.json(b, { headers: { "Cache-Control": "no-store" } });
}
