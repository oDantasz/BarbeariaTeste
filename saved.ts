// Links dos agendamentos feitos neste aparelho (para a página "Meus horários").
const KEY = "nalio:agendamentos";

export type Saved = { token: string; startsAt: string };

export function readSaved(): Saved[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => x && typeof x.token === "string") : [];
  } catch {
    return [];
  }
}

export function addSaved(s: Saved) {
  try {
    const list = readSaved().filter((x) => x.token !== s.token);
    list.push(s);
    localStorage.setItem(KEY, JSON.stringify(list.slice(-20)));
  } catch {
    /* navegador sem armazenamento: o link do agendamento continua valendo */
  }
}

export function removeSaved(token: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(readSaved().filter((x) => x.token !== token)));
  } catch {}
}
