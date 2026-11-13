"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Ban, CalendarDays, Check, ChevronLeft, ChevronRight, ExternalLink, LogOut, MessageCircle, Phone, Plus, RotateCcw, UserX, X,
} from "lucide-react";
import { Button } from "../ui/button";
import { PoleMark } from "../barber-pole";
import { NewBookingDialog } from "./new-booking";
import { signOut, updateStatus } from "@/app/painel/actions";
import {
  WD, addDays, brl, dayNum, fmtPhone, localParts, longDate, toHHMM, toMin, todayLocal, weekday,
} from "@/lib/time";
import type { Booking, BookingStatus, Catalog, Staff } from "@/lib/types";
import { cn, initials, waLink } from "@/lib/utils";

const ROW = 30; // minutos por linha
const ROW_H = 60; // px por linha

const STATUS: Record<BookingStatus, { label: string; badge: string; block: string }> = {
  confirmed: { label: "Confirmado", badge: "bg-ok-tint text-ok", block: "bg-surface" },
  done: { label: "Concluído", badge: "bg-blue-tint text-blue-ink", block: "bg-blue-tint/60" },
  no_show: { label: "Não compareceu", badge: "bg-warn-tint text-warn", block: "bg-warn-tint/70" },
  cancelled: { label: "Cancelado", badge: "bg-danger-tint text-danger", block: "bg-danger-tint/50 opacity-70" },
};

export function PainelView({
  staff, demo, day, unitId, catalog, bookings, weekCounts,
}: {
  staff: Staff; demo: boolean; day: string; unitId: string; catalog: Catalog; bookings: Booking[]; weekCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState<Booking | null>(null);
  const [newOpen, setNewOpen] = React.useState(false);
  const [showCancelled, setShowCancelled] = React.useState(false);
  const [now, setNow] = React.useState(() => localParts());
  const today = todayLocal();

  React.useEffect(() => {
    const t = setInterval(() => { router.refresh(); setNow(localParts()); }, 60_000);
    return () => clearInterval(t);
  }, [router]);

  const nav = (patch: { dia?: string; unidade?: string }) => {
    const q = new URLSearchParams({ dia: patch.dia ?? day, unidade: patch.unidade ?? unitId });
    router.push(`/painel?${q}`);
  };

  const units = catalog.units;
  const unitsShown = unitId === "all" ? units : units.filter((u) => u.id === unitId);
  const proIds = staff.role === "barber"
    ? [staff.proId!]
    : catalog.pros.map((p) => p.id).filter((id) => unitsShown.some((u) => u.pros.includes(id)));
  const pros = proIds.map((id) => catalog.pros.find((p) => p.id === id)!).filter(Boolean);

  const visible = bookings.filter(
    (b) => (unitId === "all" || b.unitId === unitId) && (showCancelled || b.status !== "cancelled"),
  );
  const active = bookings.filter((b) => (unitId === "all" || b.unitId === unitId) && b.status !== "cancelled");
  const expected = active.filter((b) => b.status !== "no_show").reduce((a, b) => a + b.totalCents, 0);
  const doneCount = active.filter((b) => b.status === "done").length;
  const cancelledCount = bookings.filter((b) => (unitId === "all" || b.unitId === unitId) && b.status === "cancelled").length;
  const nextUp = day === today
    ? active.filter((b) => b.status === "confirmed" && localParts(b.startsAt).min >= now.min).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]
    : undefined;

  // faixa de horário do dia
  const wd = weekday(day);
  const ranges = unitsShown.map((u) => u.hours[wd]).filter(Boolean) as [string, string][];
  let start = ranges.length ? Math.min(...ranges.map((r) => toMin(r[0]))) : 8 * 60;
  let end = ranges.length ? Math.max(...ranges.map((r) => toMin(r[1]))) : 19 * 60;
  for (const b of visible) {
    const s = localParts(b.startsAt).min, e = s + (Date.parse(b.endsAt) - Date.parse(b.startsAt)) / 60000;
    start = Math.min(start, Math.floor(s / ROW) * ROW);
    end = Math.max(end, Math.ceil(e / ROW) * ROW);
  }
  const rows = Array.from({ length: Math.max(1, (end - start) / ROW) }, (_, i) => start + i * ROW);
  const closed = ranges.length === 0;

  return (
    <div className="min-h-dvh bg-tile">
      {demo && (
        <div className="bg-warn-tint px-4 py-2 text-center text-sm font-semibold text-warn">
          Modo demonstração: clientes e horários abaixo são fictícios.
        </div>
      )}

      {/* topo */}
      <header className="bg-ink text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <PoleMark className="ring-white/80" />
          <p className="mr-auto font-semiwide text-lg font-extrabold">
            Painel <span className="font-medium text-white/60">{staff.role === "owner" ? "do dono" : `de ${staff.name}`}</span>
          </p>
          <Button asChild variant="ghost" size="sm" className="hidden text-white hover:bg-white/10 sm:inline-flex">
            <Link href="/" target="_blank"><ExternalLink aria-hidden />Ver site</Link>
          </Button>
          <form action={signOut}>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" type="submit">
              <LogOut aria-hidden />Sair
            </Button>
          </form>
        </div>
        <div aria-hidden className="h-1.5 bg-pole-x" />
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* data e filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" aria-label="Dia anterior" onClick={() => nav({ dia: addDays(day, -1) })}><ChevronLeft /></Button>
            <Button variant="outline" size="icon" aria-label="Próximo dia" onClick={() => nav({ dia: addDays(day, 1) })}><ChevronRight /></Button>
          </div>
          <h1 className="font-semiwide text-[clamp(1.4rem,3.5vw,2rem)] font-[850] leading-tight tracking-tight">
            {day === today ? "Hoje, " : ""}{longDate(day).replace(/^\w/, (c) => (day === today ? c.toLowerCase() : c))}
          </h1>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {day !== today && <Button variant="outline" size="sm" onClick={() => nav({ dia: today })}>Hoje</Button>}
            <label className="flex h-10 items-center gap-2 rounded-full border-2 border-grout bg-surface px-3 text-sm font-semibold">
              <CalendarDays className="size-4 text-blue" aria-hidden />
              <span className="sr-only">Ir para a data</span>
              <input type="date" value={day} onChange={(e) => e.target.value && nav({ dia: e.target.value })} className="bg-transparent outline-none tabular" />
            </label>
            {units.length > 1 && (
              <label className="flex h-10 items-center rounded-full border-2 border-grout bg-surface pl-3 text-sm font-semibold">
                <span className="sr-only">Unidade</span>
                <select value={unitId} onChange={(e) => nav({ unidade: e.target.value })} className="h-full rounded-full bg-transparent pr-2 outline-none">
                  <option value="all">Todas as unidades</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </label>
            )}
            <Button size="sm" onClick={() => setNewOpen(true)}><Plus aria-hidden />Novo agendamento</Button>
          </div>
        </div>

        {/* semana */}
        <ul className="mt-5 grid grid-cols-7 gap-1.5" aria-label="Próximos 7 dias">
          {Object.entries(weekCounts).map(([d, n]) => (
            <li key={d}>
              <button
                onClick={() => nav({ dia: d })}
                aria-current={d === day ? "date" : undefined}
                className={cn(
                  "flex w-full flex-col items-center rounded-xl border-2 py-2 leading-tight transition-colors",
                  d === day ? "border-ink bg-ink text-white" : "border-grout bg-surface hover:border-ink-2",
                )}
              >
                <span className={cn("text-xs", d === day ? "text-white/70" : "text-ink-2")}>{d === today ? "hoje" : WD[weekday(d)].slice(0, 3)}</span>
                <b className="text-lg tabular">{dayNum(d)}</b>
                <span className={cn("text-xs tabular", d === day ? "text-white/80" : "text-ink-2")}>{n}<span className="hidden sm:inline"> {n === 1 ? "cliente" : "clientes"}</span><span className="sr-only sm:hidden"> clientes</span></span>
              </button>
            </li>
          ))}
        </ul>

        {/* números do dia */}
        <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Agendamentos" value={String(active.length)} sub={cancelledCount ? `${cancelledCount} cancelado${cancelledCount > 1 ? "s" : ""}` : "nenhum cancelado"} />
          <Stat label="Faturamento previsto" value={brl(expected)} sub="sem contar faltas" />
          <Stat label="Concluídos" value={`${doneCount} de ${active.length}`} sub={active.length ? `${Math.round((doneCount / active.length) * 100)}% do dia` : "sem clientes"} />
          <Stat
            label={day === today ? "Próximo cliente" : "Primeiro cliente"}
            value={(() => {
              const b = nextUp ?? (day !== today ? active[0] : undefined);
              return b ? `${toHHMM(localParts(b.startsAt).min)} ${b.customerName.split(" ")[0]}` : "Ninguém";
            })()}
            sub={(() => {
              const b = nextUp ?? (day !== today ? active[0] : undefined);
              return b ? catalog.pros.find((p) => p.id === b.proId)?.name ?? "" : day === today ? "agenda livre até o fim do dia" : "dia sem agendamentos";
            })()}
          />
        </dl>

        <div className="mt-6 flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">Agenda</h2>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="size-4 accent-blue" />
            Mostrar cancelados
          </label>
        </div>

        {closed && !visible.length ? (
          <div className="mt-3 rounded-2xl border-2 border-dashed border-grout bg-surface p-8 text-center">
            <p className="text-lg font-semibold">Unidade fechada neste dia.</p>
          </div>
        ) : (
          <>
            {/* grade por profissional (tablet e computador) */}
            <div className="mt-3 hidden overflow-x-auto rounded-2xl border border-grout bg-surface md:block">
              <div className="grid min-w-[640px]" style={{ gridTemplateColumns: `64px repeat(${pros.length}, minmax(180px, 1fr))` }}>
                <div className="sticky top-0 z-10 border-b border-grout bg-surface" />
                {pros.map((p) => {
                  const n = active.filter((b) => b.proId === p.id).length;
                  return (
                    <div key={p.id} className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-l border-grout bg-surface px-3 py-3">
                      <span className="grid size-9 place-items-center rounded-full text-sm font-extrabold text-white" style={{ background: p.color }} aria-hidden>{initials(p.name)}</span>
                      <span className="leading-tight">
                        <b className="block">{p.name}</b>
                        <span className="text-sm text-ink-2 tabular">{n} {n === 1 ? "cliente" : "clientes"}</span>
                      </span>
                    </div>
                  );
                })}

                <div className="relative">
                  {rows.map((m) => (
                    <div key={m} className="relative border-b border-grout/70 pr-2 text-right text-xs text-ink-2 tabular" style={{ height: ROW_H }}>
                      {m % 60 === 0 && <span className="relative top-1">{toHHMM(m)}</span>}
                    </div>
                  ))}
                </div>
                {pros.map((p) => (
                  <div key={p.id} className="relative border-l border-grout">
                    {rows.map((m) => <div key={m} className={cn("border-b", m % 60 === 0 ? "border-grout/70" : "border-dashed border-grout/50")} style={{ height: ROW_H }} />)}
                    {day === today && now.min >= start && now.min <= end && (
                      <div className="pointer-events-none absolute inset-x-0 z-[5] border-t-2 border-danger" style={{ top: ((now.min - start) / ROW) * ROW_H }}>
                        <span className="absolute -left-1 -top-[5px] size-2 rounded-full bg-danger" />
                      </div>
                    )}
                    {visible.filter((b) => b.proId === p.id).map((b) => {
                      const s = localParts(b.startsAt).min;
                      const dur = (Date.parse(b.endsAt) - Date.parse(b.startsAt)) / 60000;
                      const st = STATUS[b.status];
                      return (
                        <button
                          key={b.id}
                          onClick={() => setOpen(b)}
                          className={cn(
                            "absolute inset-x-1.5 overflow-hidden rounded-lg border border-grout border-l-4 px-2.5 py-1.5 text-left shadow-[0_6px_16px_-12px_rgba(20,32,51,.6)] transition-transform hover:z-10 hover:-translate-y-px",
                            st.block,
                          )}
                          style={{ top: ((s - start) / ROW) * ROW_H + 2, height: (dur / ROW) * ROW_H - 4, borderLeftColor: p.color }}
                          aria-label={`${toHHMM(s)}, ${b.customerName}, ${b.services.map((x) => x.name).join(", ")}, ${st.label}`}
                        >
                          <span className="flex items-center gap-1 text-xs font-semibold text-ink-2 tabular">
                            {toHHMM(s)}–{toHHMM(s + dur)}
                            {b.status === "done" && <Check className="size-3.5 text-blue" aria-hidden />}
                            {b.status === "no_show" && <UserX className="size-3.5 text-warn" aria-hidden />}
                            {unitId === "all" && units.length > 1 && <span className="ml-auto rounded bg-tile px-1">{units.find((u) => u.id === b.unitId)?.name.replace("Unidade ", "UN ")}</span>}
                          </span>
                          <b className={cn("block truncate text-[0.94rem] leading-tight", b.status === "cancelled" && "line-through")}>{b.customerName}</b>
                          {dur > 30 && <span className="block truncate text-xs text-ink-2">{b.services.map((x) => x.name).join(", ")}</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* lista (celular) */}
            <ul className="mt-3 grid gap-2 md:hidden">
              {!visible.length && (
                <li className="rounded-2xl border-2 border-dashed border-grout bg-surface p-6 text-center">
                  <p className="font-semibold">Nenhum agendamento neste dia.</p>
                </li>
              )}
              {visible.map((b) => {
                const s = localParts(b.startsAt).min;
                const p = catalog.pros.find((x) => x.id === b.proId);
                const st = STATUS[b.status];
                return (
                  <li key={b.id}>
                    <button onClick={() => setOpen(b)} className="flex w-full items-stretch gap-3 rounded-xl border border-grout bg-surface p-3 text-left">
                      <span className="w-14 shrink-0 border-r border-grout pr-2 text-center">
                        <b className="block text-lg tabular">{toHHMM(s)}</b>
                        <span className="text-xs text-ink-2 tabular">{toHHMM(localParts(b.endsAt).min)}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className={cn("block truncate", b.status === "cancelled" && "line-through")}>{b.customerName}</b>
                        <span className="block truncate text-sm text-ink-2">{b.services.map((x) => x.name).join(", ")}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          {staff.role === "owner" && p && (
                            <span className="flex items-center gap-1 font-semibold"><span className="size-2 rounded-full" style={{ background: p.color }} />{p.name}</span>
                          )}
                          <span className={cn("rounded-full px-2 py-0.5 font-bold", st.badge)}>{st.label}</span>
                        </span>
                      </span>
                      <span className="self-center font-bold tabular">{brl(b.totalCents)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>

      <BookingDetails booking={open} onClose={() => setOpen(null)} catalog={catalog} />
      <NewBookingDialog open={newOpen} onOpenChange={setNewOpen} catalog={catalog} staff={staff} day={day} unitId={unitId} />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-grout bg-surface p-4">
      <dt className="text-sm font-semibold text-ink-2">{label}</dt>
      <dd className="mt-1 truncate font-semiwide text-xl font-[850] tabular sm:text-2xl">{value}</dd>
      <dd className="text-sm text-ink-2">{sub}</dd>
    </div>
  );
}

function BookingDetails({ booking, onClose, catalog }: { booking: Booking | null; onClose: () => void; catalog: Catalog }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [msg, setMsg] = React.useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  React.useEffect(() => { setMsg(null); setConfirmCancel(false); }, [booking?.id]);
  if (!booking) return null;
  const b = booking;
  const s = localParts(b.startsAt);
  const pro = catalog.pros.find((p) => p.id === b.proId);
  const unit = catalog.units.find((u) => u.id === b.unitId);
  const st = STATUS[b.status];

  const set = (status: BookingStatus) =>
    start(async () => {
      const r = await updateStatus(b.id, status);
      if (!r.ok) return setMsg(r.message);
      router.refresh();
      onClose();
    });

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-2xl bg-surface shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-2xl">
          <div aria-hidden className="h-2" style={{ background: pro?.color }} />
          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-sm font-bold", st.badge)}>{st.label}</span>
                <Dialog.Title className="mt-3 text-2xl font-extrabold leading-tight">{b.customerName}</Dialog.Title>
                <Dialog.Description className="mt-1 text-ink-2 tabular">
                  {longDate(s.date)}, {toHHMM(s.min)} às {toHHMM(localParts(b.endsAt).min)}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Fechar"><X /></Button></Dialog.Close>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={waLink(`55${b.customerPhone}`, `Olá, ${b.customerName.split(" ")[0]}! Aqui é da Barbearia do Nálio sobre seu horário de ${longDate(s.date).toLowerCase()} às ${toHHMM(s.min)}.`)} target="_blank" rel="noopener">
                  <MessageCircle aria-hidden />WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={`tel:+55${b.customerPhone}`}><Phone aria-hidden />{fmtPhone(b.customerPhone)}</a>
              </Button>
            </div>

            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 border-t border-grout pt-5 text-[0.95rem]">
              <dt className="text-ink-2">Serviços</dt>
              <dd>
                <ul className="grid gap-1">
                  {b.services.map((x) => (
                    <li key={x.id} className="flex justify-between gap-3 font-semibold"><span>{x.name}</span><span className="tabular">{brl(x.price_cents)}</span></li>
                  ))}
                </ul>
              </dd>
              <dt className="text-ink-2">Total</dt><dd className="font-extrabold tabular">{brl(b.totalCents)}</dd>
              <dt className="text-ink-2">Profissional</dt><dd className="font-semibold">{pro?.name}</dd>
              <dt className="text-ink-2">Unidade</dt><dd className="font-semibold">{unit?.name ?? b.unitId}</dd>
              <dt className="text-ink-2">Origem</dt><dd className="font-semibold">{b.source === "site" ? "Agendou pelo site" : "Lançado no painel"}</dd>
              {b.notes && (<><dt className="text-ink-2">Observação</dt><dd className="font-semibold">{b.notes}</dd></>)}
            </dl>

            {msg && <p role="alert" className="mt-5 rounded-lg bg-danger-tint px-3 py-2 font-semibold text-danger">{msg}</p>}

            <div className="mt-6 grid gap-2 border-t border-grout pt-5">
              {b.status === "confirmed" && (
                <>
                  <Button disabled={pending} onClick={() => set("done")}><Check aria-hidden />Marcar como concluído</Button>
                  <Button variant="outline" disabled={pending} onClick={() => set("no_show")}><UserX aria-hidden />Cliente não compareceu</Button>
                  {confirmCancel ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="danger" disabled={pending} onClick={() => set("cancelled")}>Sim, cancelar</Button>
                      <Button variant="ghost" onClick={() => setConfirmCancel(false)}>Manter</Button>
                    </div>
                  ) : (
                    <Button variant="danger" disabled={pending} onClick={() => setConfirmCancel(true)}><Ban aria-hidden />Cancelar agendamento</Button>
                  )}
                </>
              )}
              {b.status !== "confirmed" && (
                <Button variant="outline" disabled={pending} onClick={() => set("confirmed")}><RotateCcw aria-hidden />Voltar para confirmado</Button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
