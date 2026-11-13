import "server-only";
import { getBusy } from "./data";
import { computeSlots } from "./slots";
import { addDays, localParts, toMin, todayLocal, weekday } from "./time";
import type { Unit } from "./types";

/** Primeiros horários livres (30 min, qualquer profissional) a partir de hoje. */
export async function firstFreeDay(unit: Unit, max = 6) {
  const today = todayLocal();
  for (let i = 0; i < 14; i++) {
    const date = addDays(today, i);
    if (!unit.hours[weekday(date)]) continue;
    const slots = computeSlots({ unit, date, duration: 30, proId: "any", busy: await getBusy(unit.id, date) });
    if (slots.length) return { date, slots: slots.slice(0, max) };
  }
  return null;
}

export function openStatus(unit: Unit) {
  const now = localParts();
  const h = unit.hours[weekday(now.date)];
  if (h && now.min >= toMin(h[0]) && now.min < toMin(h[1])) return { open: true, text: `Aberto agora, fecha às ${h[1]}` };
  for (let i = 0; i < 8; i++) {
    const d = addDays(now.date, i);
    const hh = unit.hours[weekday(d)];
    if (!hh) continue;
    if (i === 0 && now.min >= toMin(hh[0])) continue;
    if (i === 0) return { open: false, text: `Fechado agora, abre às ${hh[0]}` };
    const names = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
    return { open: false, text: `Fechado agora, abre ${i === 1 ? "amanhã" : names[weekday(d)]} às ${hh[0]}` };
  }
  return { open: false, text: "Fechado" };
}
