"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { readSaved } from "@/lib/saved";
import { brl, whenText } from "@/lib/time";
import type { PublicBooking } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABEL: Record<string, string> = { confirmed: "Confirmado", done: "Concluído", no_show: "Não compareceu", cancelled: "Cancelado" };

export function MyBookings({ units, pros, bookHref }: { units: Record<string, string>; pros: Record<string, string>; bookHref: string }) {
  const [list, setList] = React.useState<PublicBooking[] | null>(null);

  React.useEffect(() => {
    const saved = readSaved();
    Promise.all(
      saved.map((s) => fetch(`/api/bookings/${s.token}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null)),
    ).then((r) => setList((r.filter(Boolean) as PublicBooking[]).sort((a, b) => b.startsAt.localeCompare(a.startsAt))));
  }, []);

  if (!list) {
    return (
      <div className="grid gap-3" aria-busy>
        {[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-grout/60" />)}
      </div>
    );
  }
  const upcoming = list.filter((b) => b.status === "confirmed" && Date.parse(b.endsAt) > Date.now()).reverse();
  const past = list.filter((b) => !upcoming.includes(b));

  if (!list.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-grout bg-surface p-8">
        <p className="mb-4 text-lg font-semibold">Nenhum horário marcado por aqui.</p>
        <p className="mb-5 text-ink-2">Se agendou em outro aparelho, abra o link que apareceu na confirmação.</p>
        <Button asChild><Link href={bookHref}>Agendar horário</Link></Button>
      </div>
    );
  }

  const Item = ({ b }: { b: PublicBooking }) => (
    <li>
      <Link
        href={`/agendamento/${b.token}`}
        className="flex items-center gap-4 rounded-xl border border-grout bg-surface p-4 transition-colors hover:border-ink-2"
      >
        <div className="min-w-0 flex-1">
          <p className={cn("font-extrabold tabular", b.status === "cancelled" && "text-ink-2 line-through")}>{whenText(b.startsAt)}</p>
          <p className="truncate text-ink-2">{b.services.map((s) => s.name).join(", ")}</p>
          <p className="text-sm text-ink-2">
            {units[b.unitId]} com {pros[b.proId]}, <span className="tabular">{brl(b.totalCents)}</span>
          </p>
        </div>
        <span className="hidden rounded-full bg-tile px-2.5 py-0.5 text-sm font-semibold sm:inline">{LABEL[b.status]}</span>
        <ChevronRight className="size-5 text-ink-2" aria-hidden />
      </Link>
    </li>
  );

  return (
    <div className="grid gap-10">
      <section aria-labelledby="prox">
        <h2 id="prox" className="mb-3 text-lg font-extrabold">Próximos</h2>
        {upcoming.length ? <ul className="grid gap-3">{upcoming.map((b) => <Item key={b.token} b={b} />)}</ul>
          : <p className="text-ink-2">Nenhum horário futuro. <Link className="font-semibold text-blue-ink underline" href={bookHref}>Agendar agora</Link></p>}
      </section>
      {past.length > 0 && (
        <section aria-labelledby="ant">
          <h2 id="ant" className="mb-3 text-lg font-extrabold">Anteriores e cancelados</h2>
          <ul className="grid gap-3">{past.map((b) => <Item key={b.token} b={b} />)}</ul>
        </section>
      )}
    </div>
  );
}
