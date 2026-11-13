"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createBooking, getStaff, isDemo, setStatus } from "@/lib/data";
import { sessionClient } from "@/lib/supabase/server";
import { BookingError, type BookingStatus } from "@/lib/types";
import { messageFor } from "@/lib/messages";
import { localToISO } from "@/lib/time";

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

export async function signIn(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (isDemo) {
    const who = String(form.get("who") ?? "");
    (await cookies()).set("demo_staff", who, { httpOnly: true, sameSite: "lax", path: "/" });
    redirect("/painel");
  }
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { ok: false, message: "Digite e-mail e senha." };
  const sb = await sessionClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, message: "E-mail ou senha incorretos." };
  const { data: staff } = await sb.from("staff").select("role").eq("user_id", data.user.id).maybeSingle();
  if (!staff) {
    await sb.auth.signOut();
    return { ok: false, message: "Esse login ainda não tem acesso ao painel. Peça ao dono para liberar." };
  }
  redirect("/painel");
}

export async function signOut() {
  if (isDemo) (await cookies()).delete("demo_staff");
  else await (await sessionClient()).auth.signOut();
  redirect("/painel/entrar");
}

const STATUSES: BookingStatus[] = ["confirmed", "done", "no_show", "cancelled"];

export async function updateStatus(id: string, status: string): Promise<ActionResult> {
  if (!STATUSES.includes(status as BookingStatus)) return { ok: false, message: "Situação inválida." };
  try {
    await setStatus(id, status as BookingStatus);
    revalidatePath("/painel");
    return { ok: true };
  } catch (e) {
    return { ok: false, message: messageFor(e instanceof BookingError ? e.code : "erro") };
  }
}

export async function createFromPanel(input: {
  unitId: string; proId: string; date: string; min: number; serviceIds: number[]; name: string; phone: string; notes: string;
}): Promise<ActionResult> {
  const staff = await getStaff();
  if (!staff) return { ok: false, message: messageFor("nao_autorizado") };
  // barbeiro só agenda para si mesmo
  const proId = staff.role === "barber" ? staff.proId : input.proId || null;
  try {
    await createBooking({
      unitId: input.unitId, proId, startsAt: localToISO(input.date, input.min), serviceIds: input.serviceIds,
      name: input.name, phone: input.phone, notes: input.notes, source: "painel",
    });
    revalidatePath("/painel");
    return { ok: true, message: "Agendamento criado." };
  } catch (e) {
    return { ok: false, message: messageFor(e instanceof BookingError ? e.code : "erro") };
  }
}
