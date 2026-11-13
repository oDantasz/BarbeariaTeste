import { NextResponse } from "next/server";
import { cancelBooking } from "@/lib/data";
import { BookingError } from "@/lib/types";
import { messageFor } from "@/lib/messages";

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    await cancelBooking(token);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const code = e instanceof BookingError ? e.code : "erro";
    return NextResponse.json({ error: code, message: messageFor(code) }, { status: 400 });
  }
}
