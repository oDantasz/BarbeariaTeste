"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, ArrowLeft, Check, Clock, Loader2, MapPin, UserRound, X } from "lucide-react";
import { Button } from "../ui/button";
import { PoleMark } from "../barber-pole";
import { CATEGORIES } from "@/lib/content";
import {
  MONTHS, WD, addDays, brl, dayNum, fmtDur, fmtPhone, longDate, toHHMM, todayLocal, weekday,
} from "@/lib/time";
import type { Catalog, Slot } from "@/lib/types";
import { addSaved } from "@/lib/saved";
import { cn, initials } from "@/lib/utils";

const STEPS = ["Unidade", "Serviços", "Profissional", "Horário", "Seus dados"];
const CLIENT_KEY = "nalio:cliente";

type Init = { unitId: string; serviceIds: number[]; proId: string | null; date: string | null; fromLink: boolean };

export function BookingFlow({ catalog, initial }: { catalog: Catalog; initial: Init }) {
  const router = useRouter();
  const [step, setStep] = React.useState(() =>
    !initial.fromLink && catalog.units.length > 1 ? 1 : initial.serviceIds.length ? 3 : 2,
  );
  const [dir, setDir] = React.useState(1);
  const [unitId, setUnitId] = React.useState(initial.unitId);
  const [serviceIds, setServiceIds] = React.useState<number[]>(initial.serviceIds);
  const [proId, setProId] = React.useState<string>(initial.proId ?? "any");
  const [date, setDate] = React.useState<string | null>(initial.date);
  const [slot, setSlot] = React.useState<Slot | null>(null);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [touched, setTouched] = React.useState({ name: false, phone: false });
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const [bust, setBust] = React.useState(0);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  const unit = catalog.units.find((u) => u.id === unitId)!;
  const chosen = serviceIds.map((id) => catalog.services.find((s) => s.id === id)!).filter(Boolean);
  const total = chosen.reduce((a, s) => a + s.price, 0);
  const minutes = chosen.reduce((a, s) => a + s.dur, 0);
  const pro = catalog.pros.find((p) => p.id === (slot?.proId ?? (proId !== "any" ? proId : "")));

  React.useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(CLIENT_KEY) ?? "null");
      if (c?.name) setName(c.name);
      if (c?.phone) setPhone(fmtPhone(c.phone));
    } catch {}
  }, []);

  const validName = name.trim().length >= 2;
  const validPhone = phone.replace(/\D/g, "").length >= 10;
  const canNext =
    step === 1 ? Boolean(unitId)
    : step === 2 ? serviceIds.length > 0
    : step === 3 ? Boolean(proId)
    : step === 4 ? Boolean(date && slot)
    : true;

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setError(null);
    setStep(n);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      bodyRef.current?.focus({ preventScroll: true });
    });
  };

  async function submit() {
    setTouched({ name: true, phone: true });
    if (!validName) return document.getElementById("f-name")?.focus();
    if (!validPhone) return document.getElementById("f-phone")?.focus();
    if (!date || !slot) return go(4);
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId, proId: proId === "any" ? null : proId, date, min: slot.min, serviceIds, name, phone, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        if (data.error === "horario_ocupado" || data.error === "horario_passado") {
          setSlot(null);
          setBust((b) => b + 1);
          go(4);
          setError(data.message);
        }
        return;
      }
      try { localStorage.setItem(CLIENT_KEY, JSON.stringify({ name: name.trim(), phone })); } catch {}
      addSaved({ token: data.token, startsAt: data.startsAt });
      router.push(`/agendamento/${data.token}?novo=1`);
    } catch {
      setError("Sem conexão. Confira a internet e tente de novo.");
    } finally {
      setSending(false);
    }
  }

  const next = () => (step === 5 ? submit() : canNext && go(step + 1));
  const nextLabel = step === 5 ? "Confirmar agendamento" : "Continuar";

  return (
    <div className="min-h-dvh pb-32 lg:pb-12">
      {/* topo */}
      <header className="sticky top-0 z-30 border-b border-grout bg-tile/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          {step > 1 ? (
            <Button variant="ghost" size="icon" onClick={() => go(step - 1)} aria-label="Voltar para a etapa anterior">
              <ArrowLeft />
            </Button>
          ) : (
            <span className="grid size-11 place-items-center"><PoleMark /></span>
          )}
          <div className="mr-auto leading-tight">
            <p className="font-extrabold">Agendar horário</p>
            <p className="text-sm text-ink-2 tabular">Etapa {step} de 5: {STEPS[step - 1]}</p>
          </div>
          <Button asChild variant="ghost" size="icon" aria-label="Sair do agendamento">
            <Link href={`/?unidade=${unitId}`}><X /></Link>
          </Button>
        </div>
        <div
          className="h-2 bg-surface"
          role="progressbar"
          aria-label="Progresso do agendamento"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={step}
        >
          <motion.div
            className="h-full bg-pole-x animate-pole-fast [--pole-period:45.25px]"
            initial={false}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-4 pt-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div ref={bodyRef} tabIndex={-1} className="outline-none">
          {error && (
            <p role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-tint px-4 py-3 font-semibold text-danger">
              <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
              {error}
            </p>
          )}
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -18 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {step === 1 && (
                <Step title="Onde você vai cortar?" lead="Escolha a unidade.">
                  <ul className="grid gap-3" role="radiogroup" aria-label="Unidades">
                    {catalog.units.map((u) => (
                      <li key={u.id}>
                        <Choice
                          radio
                          on={unitId === u.id}
                          onClick={() => {
                            if (u.id !== unitId) { setUnitId(u.id); setSlot(null); if (!u.pros.includes(proId)) setProId("any"); }
                          }}
                          title={u.name}
                          sub={u.street}
                          icon={<MapPin className="size-5 text-blue" aria-hidden />}
                        />
                      </li>
                    ))}
                  </ul>
                </Step>
              )}

              {step === 2 && (
                <Step title="O que vamos fazer?" lead="Marque um ou mais serviços. A duração e o valor somam no resumo.">
                  <div className="grid gap-8">
                    {Object.entries(CATEGORIES).map(([k, label]) => (
                      <section key={k} aria-label={label}>
                        <h3 className="mb-3 font-extrabold text-ink-2">{label}</h3>
                        <ul className="grid gap-2 sm:grid-cols-2">
                          {catalog.services.filter((s) => s.cat === k).map((s) => {
                            const on = serviceIds.includes(s.id);
                            return (
                              <li key={s.id}>
                                <Choice
                                  on={on}
                                  onClick={() => { setServiceIds(on ? serviceIds.filter((x) => x !== s.id) : [...serviceIds, s.id]); setSlot(null); }}
                                  title={s.name}
                                  sub={s.note ?? undefined}
                                  right={<><b className="block tabular">{brl(s.price)}</b><span className="text-sm text-ink-2 tabular">{fmtDur(s.dur)}</span></>}
                                />
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    ))}
                  </div>
                </Step>
              )}

              {step === 3 && (
                <Step title="Com quem?" lead={unit.name}>
                  <ul className="grid gap-3" role="radiogroup" aria-label="Profissionais">
                    <li>
                      <Choice
                        radio
                        on={proId === "any"}
                        onClick={() => { setProId("any"); setSlot(null); }}
                        title="Qualquer profissional"
                        sub="Mostra mais horários livres"
                        icon={<span className="grid size-11 place-items-center rounded-full bg-blue-tint text-blue-ink"><UserRound className="size-5" aria-hidden /></span>}
                      />
                    </li>
                    {unit.pros.map((id) => catalog.pros.find((p) => p.id === id)!).filter(Boolean).map((p) => (
                      <li key={p.id}>
                        <Choice
                          radio
                          on={proId === p.id}
                          onClick={() => { setProId(p.id); setSlot(null); }}
                          title={p.name}
                          sub={p.specialties}
                          icon={<span aria-hidden className="grid size-11 place-items-center rounded-full font-wide font-extrabold text-white" style={{ background: p.color }}>{initials(p.name)}</span>}
                        />
                      </li>
                    ))}
                  </ul>
                </Step>
              )}

              {step === 4 && (
                <TimeStep
                  unit={unit}
                  serviceIds={serviceIds}
                  proId={proId}
                  minutes={minutes}
                  proName={proId !== "any" ? catalog.pros.find((p) => p.id === proId)?.name : undefined}
                  date={date}
                  setDate={(d) => { setDate(d); setSlot(null); }}
                  slot={slot}
                  setSlot={setSlot}
                  bust={bust}
                />
              )}

              {step === 5 && (
                <Step title="Seus dados" lead="Usamos seu celular só para confirmar e lembrar do horário.">
                  <form className="grid max-w-md gap-5" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
                    <Field
                      id="f-name" label="Nome" required autoComplete="name" value={name}
                      onChange={setName} onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                      error={touched.name && !validName ? "Digite seu nome para identificarmos o agendamento." : undefined}
                    />
                    <Field
                      id="f-phone" label="Celular com DDD" required type="tel" inputMode="tel" autoComplete="tel-national"
                      placeholder="(11) 90000-0000" value={phone} onChange={(v) => setPhone(fmtPhone(v))}
                      onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                      help="Para a barbearia confirmar pelo WhatsApp."
                      error={touched.phone && !validPhone ? "Digite o celular com DDD, por exemplo (11) 91234-5678." : undefined}
                    />
                    <div className="grid gap-1.5">
                      <label htmlFor="f-notes" className="font-bold">Observação</label>
                      <textarea
                        id="f-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300}
                        placeholder="Opcional"
                        className="rounded-xl border-2 border-grout bg-surface p-3 outline-none focus:border-blue focus:ring-4 focus:ring-blue-tint"
                      />
                    </div>
                    <p className="text-sm text-ink-2">Ao confirmar, seus dados ficam guardados só para este agendamento e o contato da barbearia com você.</p>
                    <button type="submit" hidden />
                  </form>
                </Step>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* resumo (desktop) */}
        <aside className="hidden lg:block" aria-label="Resumo do agendamento">
          <div className="sticky top-28 overflow-hidden rounded-2xl border border-grout bg-surface">
            <ol className="grid gap-1 border-b border-grout p-5">
              {STEPS.map((s, i) => {
                const n = i + 1;
                const done = n < step;
                return (
                  <li key={s} className="flex items-center gap-3" aria-current={n === step ? "step" : undefined}>
                    <span
                      className={cn(
                        "grid size-7 place-items-center rounded-full text-sm font-bold tabular",
                        done ? "bg-blue text-white" : n === step ? "bg-ink text-white" : "bg-tile text-ink-2",
                      )}
                    >
                      {done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : n}
                    </span>
                    {done ? (
                      <button className="font-semibold underline-offset-4 hover:underline" onClick={() => go(n)}>{s}</button>
                    ) : (
                      <span className={cn(n === step ? "font-extrabold" : "text-ink-2")}>{s}</span>
                    )}
                  </li>
                );
              })}
            </ol>
            <Summary unitName={unit.name} services={chosen} proName={pro?.name} date={date} slot={slot} />
            <div className="border-t border-grout p-5">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-ink-2">Total</span>
                <span className="font-semiwide text-2xl font-[850] tabular">{brl(total)}</span>
              </div>
              <Button size="lg" className="w-full" onClick={next} disabled={sending || (step !== 5 && !canNext)}>
                {sending && <Loader2 className="animate-spin" aria-hidden />}
                {sending ? "Confirmando…" : nextLabel}
              </Button>
              <p className="mt-3 text-center text-sm text-ink-2">Pagamento na barbearia</p>
            </div>
          </div>
        </aside>
      </div>

      {/* barra inferior (celular) */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-grout bg-surface/95 px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <p className="flex-1 text-sm leading-tight text-ink-2">
          {chosen.length ? (
            <>
              <strong className="block text-base text-ink tabular">{brl(total)}</strong>
              <span className="tabular">{chosen.length} {chosen.length > 1 ? "serviços" : "serviço"}, {fmtDur(minutes)}</span>
            </>
          ) : (
            <><strong className="block text-base text-ink">{unit.name}</strong>Nenhum serviço escolhido</>
          )}
        </p>
        <Button onClick={next} disabled={sending || (step !== 5 && !canNext)}>
          {sending && <Loader2 className="animate-spin" aria-hidden />}
          {sending ? "Confirmando…" : step === 5 ? "Confirmar" : "Continuar"}
        </Button>
      </div>
    </div>
  );
}

function Step({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section>
      <h1 className="font-semiwide text-[clamp(1.75rem,5vw,2.4rem)] font-[850] leading-tight tracking-tight">{title}</h1>
      {lead && <p className="mb-7 mt-1 text-ink-2">{lead}</p>}
      {children}
    </section>
  );
}

function Choice({
  on, onClick, title, sub, right, icon, radio,
}: {
  on: boolean; onClick: () => void; title: string; sub?: string; right?: React.ReactNode; icon?: React.ReactNode; radio?: boolean;
}) {
  return (
    <button
      type="button"
      role={radio ? "radio" : undefined}
      aria-checked={radio ? on : undefined}
      aria-pressed={radio ? undefined : on}
      onClick={onClick}
      className={cn(
        "flex min-h-16 w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-[border-color,background-color,box-shadow] duration-200",
        on ? "border-blue bg-blue-tint shadow-[0_8px_24px_-16px_rgba(11,99,160,.8)]" : "border-grout bg-surface hover:border-ink-2",
      )}
    >
      {icon}
      {!icon && (
        <span
          aria-hidden
          className={cn(
            "grid size-6 shrink-0 place-items-center border-2 transition-colors",
            radio ? "rounded-full" : "rounded-md",
            on ? "border-blue bg-blue text-white" : "border-ink-2 bg-white",
          )}
        >
          {on && <Check className="size-4" strokeWidth={3} />}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <b className="block leading-snug">{title}</b>
        {sub && <span className="block text-sm text-ink-2">{sub}</span>}
      </span>
      {right && <span className="text-right">{right}</span>}
      {icon && (
        <span aria-hidden className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2", on ? "border-blue bg-blue text-white" : "border-ink-2")}>
          {on && <Check className="size-4" strokeWidth={3} />}
        </span>
      )}
    </button>
  );
}

function Field({
  id, label, value, onChange, onBlur, error, help, required, ...rest
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; onBlur: () => void;
  error?: string; help?: string; required?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "onBlur" | "value">) {
  const desc = [help && `${id}-help`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="font-bold">
        {label} {required && <span className="text-danger" aria-hidden>*</span>}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={desc}
        className={cn(
          "h-12 rounded-xl border-2 bg-surface px-3 text-base outline-none focus:ring-4 focus:ring-blue-tint",
          error ? "border-danger" : "border-grout focus:border-blue",
        )}
        {...rest}
      />
      {help && <p id={`${id}-help`} className="text-sm text-ink-2">{help}</p>}
      {error && <p id={`${id}-err`} className="text-sm font-semibold text-danger">{error}</p>}
    </div>
  );
}

function Summary({
  unitName, services, proName, date, slot,
}: {
  unitName: string; services: { id: number; name: string; price: number; dur: number }[]; proName?: string; date: string | null; slot: Slot | null;
}) {
  return (
    <dl className="grid gap-3 p-5 text-[0.95rem]">
      <div><dt className="text-sm text-ink-2">Unidade</dt><dd className="font-semibold">{unitName}</dd></div>
      <div>
        <dt className="text-sm text-ink-2">Serviços</dt>
        <dd>
          {services.length ? (
            <ul className="grid gap-1">
              {services.map((s) => (
                <li key={s.id} className="flex justify-between gap-3 font-semibold">
                  <span>{s.name}</span><span className="tabular">{brl(s.price)}</span>
                </li>
              ))}
            </ul>
          ) : <span className="text-ink-2">Nenhum ainda</span>}
        </dd>
      </div>
      <div><dt className="text-sm text-ink-2">Profissional</dt><dd className="font-semibold">{proName ?? "Qualquer profissional"}</dd></div>
      <div>
        <dt className="text-sm text-ink-2">Quando</dt>
        <dd className="font-semibold tabular">{date && slot ? `${longDate(date)}, às ${toHHMM(slot.min)}` : "A escolher"}</dd>
      </div>
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* Etapa de data e horário                                             */
/* ------------------------------------------------------------------ */
const cache = new Map<string, Slot[]>();

function TimeStep({
  unit, serviceIds, proId, minutes, proName, date, setDate, slot, setSlot, bust,
}: {
  unit: Catalog["units"][number]; serviceIds: number[]; proId: string; minutes: number; proName?: string;
  date: string | null; setDate: (d: string) => void; slot: Slot | null; setSlot: (s: Slot) => void; bust: number;
}) {
  const today = todayLocal();
  const days = React.useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i)), [today]);
  const [slots, setSlots] = React.useState<Slot[] | null>(null);
  const [failed, setFailed] = React.useState(false);

  const url = React.useCallback(
    (d: string) => `/api/availability?unit=${unit.id}&date=${d}&services=${serviceIds.join(",")}&pro=${proId}`,
    [unit.id, serviceIds, proId],
  );
  const load = React.useCallback(async (d: string) => {
    const u = url(d);
    if (cache.has(u)) return cache.get(u)!;
    const r = await fetch(u, { cache: "no-store" });
    if (!r.ok) throw new Error();
    const j = await r.json();
    cache.set(u, j.slots);
    return j.slots as Slot[];
  }, [url]);

  React.useEffect(() => {
    if (bust) cache.clear();
  }, [bust]);

  // sem data escolhida: procura o primeiro dia com horário livre
  React.useEffect(() => {
    if (date) return;
    let alive = true;
    (async () => {
      for (const d of days) {
        if (!unit.hours[weekday(d)]) continue;
        try {
          const s = await load(d);
          if (!alive) return;
          if (s.length) { setDate(d); return; }
        } catch { break; }
      }
      if (alive) setDate(days.find((d) => unit.hours[weekday(d)]) ?? days[0]);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  React.useEffect(() => {
    if (!date) return;
    let alive = true;
    setSlots(null);
    setFailed(false);
    load(date).then((s) => alive && setSlots(s)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [date, load, bust]);

  const groups = slots
    ? [
        { label: "Manhã", items: slots.filter((s) => s.min < 720) },
        { label: "Tarde", items: slots.filter((s) => s.min >= 720 && s.min < 1080) },
        { label: "Noite", items: slots.filter((s) => s.min >= 1080) },
      ].filter((g) => g.items.length)
    : [];
  const month = date ? `${MONTHS[Number(date.slice(5, 7)) - 1]} de ${date.slice(0, 4)}` : "";

  return (
    <Step title="Quando?" lead={`Duração: ${fmtDur(minutes)}${proName ? ` com ${proName}` : ""}.`}>
      <p className="mb-3 font-bold first-letter:uppercase">{month}</p>
      <div className="mb-8 grid grid-cols-7 gap-1.5 sm:gap-2" role="group" aria-label="Datas">
        {days.map((d, i) => {
          const closed = !unit.hours[weekday(d)];
          const on = d === date;
          return (
            <button
              key={d}
              type="button"
              disabled={closed}
              aria-pressed={on}
              aria-label={`${longDate(d)}${closed ? ", fechado" : ""}`}
              onClick={() => setDate(d)}
              className={cn(
                "relative flex h-16 flex-col items-center justify-center rounded-xl border-2 leading-tight transition-colors",
                on ? "border-blue bg-blue text-white" : "border-grout bg-surface hover:border-ink-2",
                closed && "cursor-not-allowed border-dashed bg-transparent opacity-50",
              )}
            >
              <span className={cn("text-xs", on ? "text-white/85" : "text-ink-2")}>{i === 0 ? "hoje" : WD[weekday(d)].slice(0, 3)}</span>
              <b className={cn("text-lg tabular", closed && "line-through")}>{dayNum(d)}</b>
            </button>
          );
        })}
      </div>

      <div aria-live="polite" aria-busy={!slots && !failed}>
        {failed ? (
          <p className="rounded-xl border-2 border-dashed border-grout bg-surface p-5">
            Não foi possível carregar os horários. Confira a internet e toque na data de novo.
          </p>
        ) : !slots ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2" aria-label="Carregando horários">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-grout/60" />
            ))}
          </div>
        ) : !slots.length ? (
          <p className="rounded-xl border-2 border-dashed border-grout bg-surface p-5">
            Sem horários livres neste dia para {fmtDur(minutes)} de serviço. Escolha outra data{proName ? " ou outro profissional" : ""}.
          </p>
        ) : (
          <div className="grid gap-6">
            {groups.map((g) => (
              <section key={g.label} aria-label={g.label}>
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-ink-2">
                  <Clock className="size-4" aria-hidden />{g.label}
                </h3>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
                  {g.items.map((s) => {
                    const on = slot?.min === s.min;
                    return (
                      <button
                        key={s.min}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setSlot(s)}
                        className={cn(
                          "relative h-12 rounded-lg border-2 font-bold tabular transition-colors",
                          on ? "border-blue text-white" : "border-grout bg-surface hover:border-ink-2",
                        )}
                      >
                        {on && (
                          <motion.span
                            layoutId="slot-on"
                            className="absolute inset-0 rounded-md bg-blue"
                            transition={{ type: "spring", stiffness: 500, damping: 38 }}
                          />
                        )}
                        <span className="relative">{toHHMM(s.min)}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </Step>
  );
}

