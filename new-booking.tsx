"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "../ui/button";
import { createFromPanel } from "@/app/painel/actions";
import { brl, fmtDur, fmtPhone, toHHMM, todayLocal } from "@/lib/time";
import type { Catalog, Slot, Staff } from "@/lib/types";
import { cn } from "@/lib/utils";

const input = "h-11 w-full rounded-xl border-2 border-grout bg-surface px-3 outline-none focus:border-blue focus:ring-4 focus:ring-blue-tint";
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function NewBookingDialog({
  open, onOpenChange, catalog, staff, day, unitId,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; catalog: Catalog; staff: Staff; day: string; unitId: string;
}) {
  const router = useRouter();
  const firstUnit = unitId !== "all" ? unitId : catalog.units[0]?.id;
  const [unit, setUnit] = React.useState(firstUnit);
  const [pro, setPro] = React.useState(staff.role === "barber" ? staff.proId! : "any");
  const [ids, setIds] = React.useState<number[]>([]);
  const [q, setQ] = React.useState("");
  const [date, setDate] = React.useState(day < todayLocal() ? todayLocal() : day);
  const [slots, setSlots] = React.useState<Slot[] | null>(null);
  const [min, setMin] = React.useState<number | null>(null);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    if (!open) return;
    setUnit(firstUnit); setIds([]); setMin(null); setName(""); setPhone(""); setNotes(""); setErr(null); setQ("");
    setDate(day < todayLocal() ? todayLocal() : day);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const u = catalog.units.find((x) => x.id === unit);
  const pros = (u?.pros ?? []).map((id) => catalog.pros.find((p) => p.id === id)!).filter(Boolean);
  const chosen = ids.map((id) => catalog.services.find((s) => s.id === id)!).filter(Boolean);
  const total = chosen.reduce((a, s) => a + s.price, 0);
  const minutes = chosen.reduce((a, s) => a + s.dur, 0);

  React.useEffect(() => {
    if (!open || !unit || !ids.length) { setSlots(null); return; }
    let alive = true;
    setSlots(null); setMin(null);
    fetch(`/api/availability?unit=${unit}&date=${date}&services=${ids.join(",")}&pro=${pro}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => alive && setSlots(j.slots ?? []))
      .catch(() => alive && setSlots([]));
    return () => { alive = false; };
  }, [open, unit, date, pro, ids]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!ids.length) return setErr("Escolha pelo menos um serviço.");
    if (min == null) return setErr("Escolha o horário.");
    if (name.trim().length < 2) return setErr("Digite o nome do cliente.");
    if (phone.replace(/\D/g, "").length < 10) return setErr("Digite o celular do cliente com DDD.");
    start(async () => {
      const r = await createFromPanel({ unitId: unit!, proId: pro === "any" ? "" : pro, date, min, serviceIds: ids, name, phone, notes });
      if (!r.ok) return setErr(r.message);
      onOpenChange(false);
      router.push(`/painel?dia=${date}&unidade=${unitId}`);
      router.refresh();
    });
  };

  const list = catalog.services.filter((s) => !q || norm(s.name).includes(norm(q)));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[94dvh] flex-col rounded-t-2xl bg-surface shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90dvh] sm:w-[640px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
          <div className="flex items-center justify-between border-b border-grout px-6 py-4">
            <div>
              <Dialog.Title className="text-xl font-extrabold">Novo agendamento</Dialog.Title>
              <Dialog.Description className="text-sm text-ink-2">Para cliente que ligou ou chegou na barbearia.</Dialog.Description>
            </div>
            <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Fechar"><X /></Button></Dialog.Close>
          </div>

          <form id="new-booking" onSubmit={submit} className="grid gap-5 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {catalog.units.length > 1 && (
                <label className="grid gap-1.5 font-bold">Unidade
                  <select className={input} value={unit} onChange={(e) => { setUnit(e.target.value); if (staff.role === "owner") setPro("any"); }}>
                    {catalog.units.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                </label>
              )}
              <label className="grid gap-1.5 font-bold">Profissional
                <select className={input} value={pro} onChange={(e) => setPro(e.target.value)} disabled={staff.role === "barber"}>
                  {staff.role === "owner" && <option value="any">Primeiro livre</option>}
                  {pros.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            </div>

            <fieldset className="grid gap-2">
              <legend className="mb-1.5 font-bold">Serviços</legend>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-2" aria-hidden />
                <input className={cn(input, "pl-9")} placeholder="Buscar serviço" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar serviço" />
              </div>
              <ul className="grid max-h-48 gap-1 overflow-y-auto rounded-xl border border-grout p-1.5">
                {list.map((s) => {
                  const on = ids.includes(s.id);
                  return (
                    <li key={s.id}>
                      <label className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2", on ? "bg-blue-tint" : "hover:bg-tile")}>
                        <input type="checkbox" className="size-4 accent-blue" checked={on} onChange={() => setIds(on ? ids.filter((x) => x !== s.id) : [...ids, s.id])} />
                        <span className="flex-1 font-semibold">{s.name}</span>
                        <span className="text-sm text-ink-2 tabular">{fmtDur(s.dur)}</span>
                        <span className="w-20 text-right font-bold tabular">{brl(s.price)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              {chosen.length > 0 && <p className="text-sm text-ink-2 tabular">{chosen.length} selecionado{chosen.length > 1 ? "s" : ""}: {fmtDur(minutes)}, {brl(total)}</p>}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
              <label className="grid gap-1.5 self-start font-bold">Data
                <input type="date" className={cn(input, "tabular")} value={date} min={todayLocal()} onChange={(e) => e.target.value && setDate(e.target.value)} />
              </label>
              <div className="grid gap-1.5">
                <span className="font-bold" id="hora-label">Horário</span>
                {!ids.length ? (
                  <p className="text-sm text-ink-2">Escolha os serviços para ver os horários livres.</p>
                ) : !slots ? (
                  <p className="flex items-center gap-2 text-sm text-ink-2"><Loader2 className="size-4 animate-spin" aria-hidden />Carregando horários</p>
                ) : !slots.length ? (
                  <p className="text-sm font-semibold text-danger">Sem horários livres nesta data.</p>
                ) : (
                  <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto" role="group" aria-labelledby="hora-label">
                    {slots.map((s) => (
                      <button
                        key={s.min}
                        type="button"
                        aria-pressed={min === s.min}
                        onClick={() => setMin(s.min)}
                        className={cn("h-10 rounded-lg border-2 px-3 font-bold tabular", min === s.min ? "border-blue bg-blue text-white" : "border-grout hover:border-ink-2")}
                      >
                        {toHHMM(s.min)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 font-bold">Nome do cliente
                <input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
              </label>
              <label className="grid gap-1.5 font-bold">Celular
                <input className={cn(input, "tabular")} type="tel" inputMode="tel" placeholder="(11) 90000-0000" value={phone} onChange={(e) => setPhone(fmtPhone(e.target.value))} autoComplete="off" />
              </label>
            </div>
            <label className="grid gap-1.5 font-bold">Observação
              <input className={input} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
            </label>
            {err && <p role="alert" className="rounded-lg bg-danger-tint px-3 py-2 font-semibold text-danger">{err}</p>}
          </form>

          <div className="flex justify-end gap-2 border-t border-grout px-6 py-4">
            <Dialog.Close asChild><Button variant="ghost">Cancelar</Button></Dialog.Close>
            <Button type="submit" form="new-booking" disabled={pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              Salvar agendamento
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
