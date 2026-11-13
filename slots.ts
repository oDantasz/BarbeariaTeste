import type { Busy, Slot, Unit } from "./types";
import { SLOT, localParts, localToISO, toMin, weekday } from "./time";

/** Horários livres de um dia para uma duração (já arredondada para blocos de 30 min). */
export function computeSlots(opts: {
  unit: Unit;
  date: string;
  duration: number;
  proId: string | "any";
  busy: Busy[];
  now?: Date;
}): Slot[] {
  const { unit, date, duration, proId, busy } = opts;
  const hours = unit.hours[weekday(date)];
  if (!hours) return [];
  const now = localParts(opts.now ?? new Date());
  if (date < now.date) return [];
  const minStart = date === now.date ? now.min + 15 : -1;
  const candidates = proId === "any" ? unit.pros : unit.pros.filter((p) => p === proId);

  const ranges = busy.map((b) => ({ proId: b.proId, s: Date.parse(b.startsAt), e: Date.parse(b.endsAt) }));
  const out: Slot[] = [];
  for (let m = toMin(hours[0]); m + duration <= toMin(hours[1]); m += SLOT) {
    if (m < minStart) continue;
    const s = Date.parse(localToISO(date, m));
    const e = s + duration * 60_000;
    const free = candidates.find((p) => !ranges.some((r) => r.proId === p && r.s < e && r.e > s));
    if (free) out.push({ min: m, proId: free });
  }
  return out;
}
