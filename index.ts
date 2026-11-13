import "server-only";
import { cookies } from "next/headers";
import type { Booking, BookingStatus, Busy, Catalog, NewBooking, PublicBooking, Staff } from "../types";
import { BookingError } from "../types";
import { hasSupabase, publicClient, sessionClient } from "../supabase/server";
import { codeFromError } from "../messages";
import * as demo from "./demo";

export const isDemo = !hasSupabase;

type Created = { token: string; proId: string; startsAt: string; endsAt: string; totalCents: number };

/* ------------------------------------------------------------------ */
/* Catálogo                                                            */
/* ------------------------------------------------------------------ */
export async function getCatalog(): Promise<Catalog> {
  if (isDemo) return demo.catalog();
  const sb = publicClient();
  const [u, h, s, p, pu] = await Promise.all([
    sb.from("units").select("*").order("sort"),
    sb.from("opening_hours").select("*"),
    sb.from("services").select("*").order("sort"),
    sb.from("professionals").select("*").order("sort"),
    sb.from("professional_units").select("*"),
  ]);
  const err = u.error || h.error || s.error || p.error || pu.error;
  if (err) throw new Error(err.message);
  const proOrder = (p.data ?? []).map((x) => x.id as string);
  return {
    units: (u.data ?? []).map((x) => ({
      id: x.id, name: x.name, area: x.area, street: x.street, city: x.city, cep: x.cep,
      phone: x.phone, whatsapp: x.whatsapp, rating: Number(x.rating), amenities: x.amenities ?? [],
      hours: Object.fromEntries(
        [0, 1, 2, 3, 4, 5, 6].map((d) => {
          const r = (h.data ?? []).find((y) => y.unit_id === x.id && y.weekday === d);
          return [d, r ? [String(r.opens).slice(0, 5), String(r.closes).slice(0, 5)] : null];
        }),
      ),
      pros: (pu.data ?? [])
        .filter((y) => y.unit_id === x.id && proOrder.includes(y.professional_id))
        .map((y) => y.professional_id as string)
        .sort((a, b) => proOrder.indexOf(a) - proOrder.indexOf(b)),
    })),
    services: (s.data ?? []).map((x) => ({
      id: x.id, name: x.name, note: x.note, price: x.price_cents, dur: x.duration_min, cat: x.category,
    })),
    pros: (p.data ?? []).map((x) => ({ id: x.id, name: x.name, role: x.role, specialties: x.specialties, color: x.color })),
  };
}

/* ------------------------------------------------------------------ */
/* Público                                                             */
/* ------------------------------------------------------------------ */
export async function getBusy(unitId: string, date: string): Promise<Busy[]> {
  if (isDemo) return demo.busy(unitId, date);
  const { data, error } = await publicClient().rpc("busy_slots", { p_unit: unitId, p_day: date });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { professional_id: string; starts_at: string; ends_at: string }) => ({
    proId: r.professional_id, startsAt: r.starts_at, endsAt: r.ends_at,
  }));
}

export async function createBooking(nb: NewBooking): Promise<Created> {
  if (isDemo) {
    const staff = nb.source === "painel" ? await getStaff() : null;
    return demo.create(nb, Boolean(staff));
  }
  const client = nb.source === "painel" ? await sessionClient() : publicClient();
  const { data, error } = await client.rpc("create_booking", {
    p_unit: nb.unitId,
    p_professional: nb.proId,
    p_starts_at: nb.startsAt,
    p_service_ids: nb.serviceIds,
    p_name: nb.name,
    p_phone: nb.phone,
    p_notes: nb.notes ?? null,
    p_source: nb.source ?? "site",
  });
  if (error) throw new BookingError(codeFromError(error));
  const r = data[0];
  return { token: r.token, proId: r.professional_id, startsAt: r.starts_at, endsAt: r.ends_at, totalCents: r.total_cents };
}

export async function getBooking(token: string): Promise<PublicBooking | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  if (isDemo) return demo.get(token);
  const { data, error } = await publicClient().rpc("get_booking", { p_token: token });
  if (error) throw new Error(error.message);
  const r = data?.[0];
  if (!r) return null;
  return {
    token: r.token, unitId: r.unit_id, proId: r.professional_id, startsAt: r.starts_at, endsAt: r.ends_at,
    customerName: r.customer_name, services: r.services, totalCents: r.total_cents, status: r.status,
  };
}

export async function cancelBooking(token: string) {
  if (isDemo) return demo.cancel(token);
  const { error } = await publicClient().rpc("cancel_booking", { p_token: token });
  if (error) throw new BookingError(codeFromError(error));
}

/* ------------------------------------------------------------------ */
/* Painel                                                              */
/* ------------------------------------------------------------------ */
export async function getStaff(): Promise<Staff | null> {
  if (isDemo) {
    const who = (await cookies()).get("demo_staff")?.value;
    return demo.staffFor(who);
  }
  const sb = await sessionClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("staff").select("role, professional_id, professionals(name)").eq("user_id", user.id).maybeSingle();
  if (!data) return null;
  const proName = (data.professionals as unknown as { name: string } | null)?.name;
  return { role: data.role, proId: data.professional_id, name: proName ?? "Dono", email: user.email };
}

export async function listBookings(from: string, to: string): Promise<Booking[]> {
  const staff = await getStaff();
  if (!staff) return [];
  if (isDemo) return demo.list(from, to, staff);
  const sb = await sessionClient();
  const { data, error } = await sb
    .from("bookings")
    .select("*")
    .gte("starts_at", from)
    .lt("starts_at", to)
    .order("starts_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id, token: r.token, unitId: r.unit_id, proId: r.professional_id, startsAt: r.starts_at, endsAt: r.ends_at,
    customerName: r.customer_name, customerPhone: r.customer_phone, notes: r.notes, services: r.services,
    totalCents: r.total_cents, status: r.status, source: r.source,
  }));
}

export async function setStatus(id: string, status: BookingStatus) {
  const staff = await getStaff();
  if (!staff) throw new BookingError("nao_autorizado");
  if (isDemo) return demo.setStatus(id, status, staff);
  const sb = await sessionClient();
  const { data, error } = await sb
    .from("bookings")
    .update({ status, cancelled_at: status === "cancelled" ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id");
  if (error) throw new BookingError(codeFromError(error));
  if (!data?.length) throw new BookingError("nao_autorizado");
}
