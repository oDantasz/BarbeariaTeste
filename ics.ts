import { localParts, toHHMM } from "./time";

export function downloadICS(opts: { id: string; startsAt: string; endsAt: string; title: string; location: string; description: string }) {
  const f = (iso: string) => {
    const { date, min } = localParts(iso);
    return `${date.replace(/-/g, "")}T${toHHMM(min).replace(":", "")}00`;
  };
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Barbearia do Nalio//PT", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${opts.id}@barbeariadonalio`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;TZID=America/Sao_Paulo:${f(opts.startsAt)}`,
    `DTEND;TZID=America/Sao_Paulo:${f(opts.endsAt)}`,
    `SUMMARY:${esc(opts.title)}`,
    `LOCATION:${esc(opts.location)}`,
    `DESCRIPTION:${esc(opts.description)}`,
    "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", "DESCRIPTION:Lembrete do seu horário", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  a.download = "horario-barbearia-do-nalio.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
