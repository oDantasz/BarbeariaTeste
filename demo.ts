import "server-only";
import type { Booking, BookingStatus, Busy, NewBooking, PublicBooking, Staff } from "../types";
import { BookingError } from "../types";
import { DEMO_CATALOG } from "./demo-catalog";
import { SLOT, addDays, blockDur, localParts, localToISO, toMin, todayLocal, weekday } from "../time";

/*
  Modo demonstração: usado quando o Supabase ainda não foi configurado.
  Os dados ficam só na memória do servidor e somem quando ele reinicia.
  Segue as mesmas regras do banco (supabase/schema.sql).
*/

type Store = { bookings: Booking[]; seeded: string };
const g = globalThis as unknown as { __nalioDemo?: Store };

const FIRST = ["Lucas", "Mateus", "Gabriel", "João", "Pedro", "Thiago", "Bruno", "Felipe", "André", "Caio", "Vinícius", "Leandro", "Marcos", "Henrique", "Rodrigo", "Daniel"];
const LAST = ["Souza", "Oliveira", "Santos", "Lima", "Costa", "Pereira", "Almeida", "Ribeiro", "Carvalho", "Gomes"];

function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    s = Math.imul(s ^ (s >>> 13), 3266489909) >>> 0;
    return ((s ^ (s >>> 16)) >>> 0) / 4294967296;
  };
}

function store(): Store {
  const today = todayLocal();
  if (g.__nalioDemo && g.__nalioDemo.seeded === today) return g.__nalioDemo;
  const r = rand(Number(today.replace(/-/g, "")));
  const bookings: Booking[] = [];
  const now = Date.now();
  for (let i = -3; i <= 10; i++) {
    const date = addDays(today, i);
    for (const unit of DEMO_CATALOG.units) {
      const h = unit.hours[weekday(date)];
      if (!h) continue;
      for (const proId of unit.pros) {
        if (bookings.some((b) => b.proId === proId && b.startsAt.startsWith(date) && b.unitId !== unit.id)) continue;
        let m = toMin(h[0]);
        while (m < toMin(h[1])) {
          const fill = i <= 1 ? 0.5 : 0.28;
          if (r() < fill) {
            const svc = DEMO_CATALOG.services[Math.floor(r() * 12)];
            const dur = blockDur(svc.dur);
            if (m + dur > toMin(h[1])) break;
            const start = localToISO(date, m);
            const end = new Date(Date.parse(start) + dur * 60000).toISOString();
            const past = Date.parse(end) < now;
            bookings.push({
              id: crypto.randomUUID(), token: crypto.randomUUID(), unitId: unit.id, proId,
              startsAt: start, endsAt: end,
              customerName: `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`,
              customerPhone: `119${String(Math.floor(r() * 1e8)).padStart(8, "0")}`,
              notes: null,
              services: [{ id: svc.id, name: svc.name, price_cents: svc.price, duration_min: svc.dur }],
              totalCents: svc.price,
              status: past ? (r() < 0.9 ? "done" : "no_show") : "confirmed",
              source: r() < 0.8 ? "site" : "painel",
            });
            m += dur;
          } else m += SLOT;
        }
      }
    }
  }
  g.__nalioDemo = { bookings, seeded: today };
  return g.__nalioDemo;
}

export const catalog = async () => DEMO_CATALOG;

const overlaps = (b: Booking, s: number, e: number) =>
  b.status !== "cancelled" && Date.parse(b.startsAt) < e && Date.parse(b.endsAt) > s;

export async function busy(unitId: string, date: string): Promise<Busy[]> {
  const unit = DEMO_CATALOG.units.find((u) => u.id === unitId);
  if (!unit) return [];
  const s = Date.parse(localToISO(date, 0)), e = s + 86400000;
  return store().bookings
    .filter((b) => unit.pros.includes(b.proId) && overlaps(b, s, e))
    .map((b) => ({ proId: b.proId, startsAt: b.startsAt, endsAt: b.endsAt }));
}

export async function create(nb: NewBooking, isStaff: boolean) {
  const st = store();
  const ids = [...new Set(nb.serviceIds)];
  if (!ids.length) throw new BookingError("sem_servico");
  const svcs = ids.map((id) => DEMO_CATALOG.services.find((s) => s.id === id));
  if (svcs.some((s) => !s)) throw new BookingError("servico_invalido");
  const services = svcs.map((s) => ({ id: s!.id, name: s!.name, price_cents: s!.price, duration_min: s!.dur }));
  const total = services.reduce((a, s) => a + s.price_cents, 0);
  const dur = blockDur(services.reduce((a, s) => a + s.duration_min, 0));
  const start = Date.parse(nb.startsAt);
  if (Number.isNaN(start)) throw new BookingError("horario_invalido");
  const end = start + dur * 60000;
  const source = nb.source === "painel" && isStaff ? "painel" : "site";

  if (source === "site" && start < Date.now() + 15 * 60000) throw new BookingError("horario_passado");
  if (start > Date.now() + 60 * 86400000) throw new BookingError("horario_distante");
  const loc = localParts(new Date(start));
  if (loc.min % 30 !== 0) throw new BookingError("horario_invalido");
  const unit = DEMO_CATALOG.units.find((u) => u.id === nb.unitId);
  const h = unit?.hours[weekday(loc.date)];
  const locEnd = localParts(new Date(end));
  if (!unit || !h || loc.min < toMin(h[0]) || locEnd.date !== loc.date || locEnd.min > toMin(h[1]))
    throw new BookingError("fora_do_horario");
  if (nb.name.trim().length < 2) throw new BookingError("nome_invalido");
  const phone = nb.phone.replace(/\D/g, "");
  if (phone.length < 10 || phone.length > 13) throw new BookingError("telefone_invalido");
  if (source === "site" && st.bookings.filter((b) => b.customerPhone === phone && b.status === "confirmed" && Date.parse(b.startsAt) > Date.now()).length >= 3)
    throw new BookingError("limite_agendamentos");

  const candidates = unit.pros.filter((p) => !nb.proId || p === nb.proId);
  if (!candidates.length) throw new BookingError("profissional_invalido");
  const proId = candidates.find((p) => !st.bookings.some((b) => b.proId === p && overlaps(b, start, end)));
  if (!proId) throw new BookingError("horario_ocupado");

  const b: Booking = {
    id: crypto.randomUUID(), token: crypto.randomUUID(), unitId: unit.id, proId,
    startsAt: new Date(start).toISOString(), endsAt: new Date(end).toISOString(),
    customerName: nb.name.trim(), customerPhone: phone, notes: nb.notes?.trim() || null,
    services, totalCents: total, status: "confirmed", source,
  };
  st.bookings.push(b);
  return { token: b.token, proId, startsAt: b.startsAt, endsAt: b.endsAt, totalCents: total };
}

export async function get(token: string): Promise<PublicBooking | null> {
  const b = store().bookings.find((x) => x.token === token);
  if (!b) return null;
  const { id: _i, customerPhone: _p, notes: _n, source: _s, ...pub } = b;
  return pub;
}

export async function cancel(token: string) {
  const b = store().bookings.find((x) => x.token === token);
  if (!b) throw new BookingError("nao_encontrado");
  if (b.status !== "confirmed") throw new BookingError("nao_cancelavel");
  if (Date.parse(b.startsAt) < Date.now() + 2 * 3600000) throw new BookingError("cancelamento_tarde");
  b.status = "cancelled";
}

export function staffFor(who?: string): Staff | null {
  if (who === "owner") return { role: "owner", proId: null, name: "Dono", email: "dono@demo" };
  const p = DEMO_CATALOG.pros.find((x) => x.id === who);
  return p ? { role: "barber", proId: p.id, name: p.name, email: `${p.id}@demo` } : null;
}

export async function list(from: string, to: string, staff: Staff) {
  const f = Date.parse(from), t = Date.parse(to);
  return store().bookings
    .filter((b) => Date.parse(b.startsAt) >= f && Date.parse(b.startsAt) < t)
    .filter((b) => staff.role === "owner" || b.proId === staff.proId)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function setStatus(id: string, status: BookingStatus, staff: Staff) {
  const b = store().bookings.find((x) => x.id === id);
  if (!b || (staff.role !== "owner" && b.proId !== staff.proId)) throw new BookingError("nao_autorizado");
  if (status !== "cancelled" && b.status === "cancelled") {
    const s = Date.parse(b.startsAt), e = Date.parse(b.endsAt);
    if (store().bookings.some((x) => x !== b && x.proId === b.proId && overlaps(x, s, e))) throw new BookingError("horario_ocupado");
  }
  b.status = status;
}
