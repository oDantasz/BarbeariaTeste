// O Brasil não tem horário de verão desde 2019: São Paulo é sempre UTC-3.
export const TZ = "America/Sao_Paulo";
export const TZ_OFFSET = "-03:00";
export const SLOT = 30;

export const WD = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
export const WD_FULL = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
export const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const pad = (n: number) => String(n).padStart(2, "0");

export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const toHHMM = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/** Data e minuto do dia no fuso de São Paulo */
export function localParts(d: Date | string = new Date()) {
  const date = typeof d === "string" ? new Date(d) : d;
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(date).map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) };
}

export const todayLocal = () => localParts().date;

export const localToISO = (date: string, min: number) => `${date}T${toHHMM(min)}:00${TZ_OFFSET}`;

export const weekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

export function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function dayNum(date: string) {
  return Number(date.slice(8, 10));
}

export function longDate(date: string) {
  const [, m, d] = date.split("-").map(Number);
  return `${WD_FULL[weekday(date)]}, ${d} de ${MONTHS[m - 1]}`;
}

export function relativeDay(date: string) {
  const t = todayLocal();
  if (date === t) return "Hoje";
  if (date === addDays(t, 1)) return "Amanhã";
  const [, m, d] = date.split("-").map(Number);
  const w = WD[weekday(date)];
  return `${w[0].toUpperCase()}${w.slice(1)}, ${d} de ${MONTHS[m - 1]}`;
}

export function whenText(iso: string) {
  const { date, min } = localParts(iso);
  return `${longDate(date)}, às ${toHHMM(min)}`;
}

export const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDur = (m: number) =>
  m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? pad(m % 60) : ""}`;

export const blockDur = (m: number) => Math.max(SLOT, Math.ceil(m / SLOT) * SLOT);

export function fmtPhone(v: string) {
  const d = v.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
