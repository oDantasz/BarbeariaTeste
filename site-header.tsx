"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { CalendarDays, Check, ChevronDown, MapPin, X } from "lucide-react";
import { PoleMark } from "./barber-pole";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { readSaved } from "@/lib/saved";

type U = { id: string; name: string; street: string; area: string };

export function SiteHeader({ units, unitId, bookHref }: { units: U[]; unitId: string; bookHref: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [count, setCount] = React.useState(0);
  const unit = units.find((u) => u.id === unitId) ?? units[0];
  React.useEffect(() => setCount(readSaved().filter((s) => Date.parse(s.startsAt) > Date.now()).length), []);

  return (
    <header className="sticky top-0 z-40 border-b border-grout/80 bg-tile/85 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-3">
        <Link href={`/?unidade=${unit.id}`} className="mr-auto flex items-center gap-2.5 rounded-lg" aria-label="Barbearia do Nálio, início">
          <PoleMark />
          <span className="font-semiwide text-[1.05rem] font-extrabold tracking-tight">
            <span className="hidden sm:inline">Barbearia do </span>Nálio
          </span>
        </Link>

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="flex h-11 items-center gap-1.5 rounded-full border border-grout bg-surface pl-3 pr-2.5 text-[0.94rem] font-semibold hover:border-ink-2">
              <MapPin className="size-[17px] text-blue" aria-hidden />
              {unit.name}
              <ChevronDown className="size-4 text-ink-2" aria-hidden />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px]" />
            <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[440px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
              <div className="mb-4 flex items-center justify-between">
                <Dialog.Title className="text-lg font-extrabold">Escolha a unidade</Dialog.Title>
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" aria-label="Fechar"><X /></Button>
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">A página mostra serviços, horários e endereço da unidade escolhida.</Dialog.Description>
              <ul className="grid gap-2" role="radiogroup" aria-label="Unidades">
                {units.map((u) => {
                  const on = u.id === unit.id;
                  return (
                    <li key={u.id}>
                      <button
                        role="radio"
                        aria-checked={on}
                        onClick={() => { setOpen(false); router.push(`/?unidade=${u.id}`, { scroll: false }); }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-colors",
                          on ? "border-blue bg-blue-tint" : "border-grout hover:border-ink-2",
                        )}
                      >
                        <span className={cn("grid size-6 place-items-center rounded-full border-2", on ? "border-blue bg-blue text-white" : "border-ink-2")}>
                          {on && <Check className="size-4" strokeWidth={3} aria-hidden />}
                        </span>
                        <span>
                          <b className="block">{u.name}</b>
                          <span className="text-sm text-ink-2">{u.street}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <Link
          href="/meus-horarios"
          className="flex h-11 items-center gap-1.5 rounded-full px-2.5 font-semibold hover:bg-surface sm:px-3"
          aria-label={`Meus horários${count ? `, ${count} salvo${count > 1 ? "s" : ""}` : ""}`}
        >
          <CalendarDays className="size-5" aria-hidden />
          <span className="hidden md:inline">Meus horários</span>
          {count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-leather px-1.5 text-xs text-white tabular">{count}</span>}
        </Link>
        <Button asChild size="sm" className="hidden lg:inline-flex">
          <Link href={bookHref}>Agendar horário</Link>
        </Button>
      </div>
    </header>
  );
}
