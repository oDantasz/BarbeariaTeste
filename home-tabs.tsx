"use client";
import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Accessibility, Baby, Car, Clock, Search, Star, Wifi, X } from "lucide-react";
import { LimelightTabs } from "../ui/limelight-tabs";
import { SpotlightCard } from "../ui/spotlight-card";
import { Button } from "../ui/button";
import { AMENITIES, CATEGORIES, PACKS, SHOP_NAME, SUBS, type Offer } from "@/lib/content";
import { brl, fmtDur } from "@/lib/time";
import type { Pro, Service, Unit } from "@/lib/types";
import { cn, initials, mapsLink, waLink } from "@/lib/utils";

const AMENITY_ICON: Record<string, React.ElementType> = { wifi: Wifi, parking: Car, access: Accessibility, kids: Baby };
const TABS = [
  { id: "servicos", label: "Serviços" },
  { id: "profissionais", label: "Profissionais" },
  { id: "pacotes", label: "Pacotes" },
  { id: "assinaturas", label: "Assinaturas" },
  { id: "avaliacoes", label: "Avaliações" },
];
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function HomeTabs({ unit, services, pros }: { unit: Unit; services: Service[]; pros: Pro[] }) {
  const [tab, setTab] = React.useState("servicos");
  const [amen, setAmen] = React.useState<string | null>(null);

  React.useEffect(() => {
    const h = location.hash.slice(1);
    if (TABS.some((t) => t.id === h)) setTab(h);
  }, []);
  const change = (id: string) => {
    setTab(id);
    history.replaceState(null, "", `${location.pathname}${location.search}#${id}`);
  };
  const unitPros = unit.pros.map((id) => pros.find((p) => p.id === id)!).filter(Boolean);

  return (
    <div>
      <section aria-label="Comodidades" className="mb-8">
        <ul className="flex flex-wrap gap-2">
          {unit.amenities.map((k) => {
            const Icon = AMENITY_ICON[k] ?? Star;
            const on = amen === k;
            return (
              <li key={k}>
                <button
                  aria-expanded={on}
                  aria-controls="amenity-note"
                  onClick={() => setAmen(on ? null : k)}
                  className={cn(
                    "flex h-11 items-center gap-2 rounded-full border px-4 text-[0.94rem] font-semibold transition-colors",
                    on ? "border-blue bg-blue-tint text-blue-ink" : "border-grout bg-surface hover:border-ink-2",
                  )}
                >
                  <Icon className="size-[18px]" aria-hidden />
                  {AMENITIES[k]?.label ?? k}
                </button>
              </li>
            );
          })}
        </ul>
        <div id="amenity-note" aria-live="polite">
          <AnimatePresence initial={false}>
            {amen && (
              <motion.p
                key={amen}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="mt-3 max-w-[60ch] rounded-r-lg border-l-4 border-blue bg-surface px-4 py-3 text-[0.95rem]"
              >
                {AMENITIES[amen]?.text}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </section>

      <div className="sticky top-16 z-30 -mx-4 border-b-2 border-grout bg-tile/95 px-2 backdrop-blur sm:mx-0 sm:px-0">
        <LimelightTabs items={TABS} value={tab} onChange={change} label="Informações da barbearia" />
      </div>

      <div className="pt-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            role="tabpanel"
            id={`painel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {tab === "servicos" && <ServicesPanel unit={unit} services={services} />}
            {tab === "profissionais" && <ProsPanel unit={unit} pros={unitPros} />}
            {tab === "pacotes" && <OffersPanel unit={unit} offers={PACKS} monthly={false} />}
            {tab === "assinaturas" && <OffersPanel unit={unit} offers={SUBS} monthly />}
            {tab === "avaliacoes" && <ReviewsPanel unit={unit} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function PanelTitle({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-semiwide text-[1.85rem] font-extrabold leading-tight tracking-tight">{title}</h2>
      <p className="mt-1 max-w-[60ch] text-ink-2">{lead}</p>
    </div>
  );
}

function ServicesPanel({ unit, services }: { unit: Unit; services: Service[] }) {
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState("cat");
  const list = services.filter((s) => !q || norm(`${s.name} ${s.note ?? ""}`).includes(norm(q)));
  const sorted = sort === "cat" ? list : [...list].sort(
    sort === "price-asc" ? (a, b) => a.price - b.price || a.dur - b.dur
      : sort === "price-desc" ? (a, b) => b.price - a.price
      : (a, b) => a.dur - b.dur || a.price - b.price,
  );
  const groups = sort === "cat"
    ? Object.entries(CATEGORIES).map(([k, label]) => ({ label, items: sorted.filter((s) => s.cat === k) })).filter((g) => g.items.length)
    : [{ label: "", items: sorted }];

  return (
    <>
      <PanelTitle title="Serviços" lead="Escolha um serviço para agendar. Dá para juntar mais de um no mesmo horário." />
      <div className="mb-8 flex flex-wrap gap-3">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm font-semibold text-ink-2">
          Buscar serviço
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-ink-2" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ex.: barba, selagem"
              className="h-12 w-full rounded-xl border-2 border-grout bg-surface pl-10 pr-3 text-base font-normal text-ink outline-none focus:border-blue"
            />
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
          Ordenar por
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-12 rounded-xl border-2 border-grout bg-surface px-3 text-base font-normal text-ink outline-none focus:border-blue"
          >
            <option value="cat">Tipo de serviço</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="dur">Mais rápido</option>
          </select>
        </label>
      </div>

      {!list.length ? (
        <div className="rounded-xl border-2 border-dashed border-grout bg-surface p-6">
          <p className="mb-3">Nenhum serviço encontrado para “{q}”.</p>
          <Button variant="outline" size="sm" onClick={() => setQ("")}><X aria-hidden />Limpar busca</Button>
        </div>
      ) : (
        <div className="grid gap-8">
          {groups.map((g) => (
            <section key={g.label || "all"} aria-label={g.label || "Serviços"}>
              {g.label && (
                <h3 className="mb-3 flex items-baseline gap-2 text-[1.0625rem] font-extrabold">
                  {g.label}
                  <span className="text-sm font-medium text-ink-2">{g.items.length} {g.items.length > 1 ? "serviços" : "serviço"}</span>
                </h3>
              )}
              <SpotlightCard className="divide-y divide-grout">
                <ul className="divide-y divide-grout">
                  {g.items.map((s) => (
                    <li key={s.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 sm:grid-cols-[1fr_auto_auto] sm:pl-5">
                      <div>
                        <p className="text-[1.0625rem] font-bold leading-snug">{s.name}</p>
                        {s.note && <p className="text-sm text-ink-2">{s.note}</p>}
                        <p className="mt-0.5 flex gap-3 text-[0.94rem] text-ink-2 sm:hidden">
                          <span className="font-bold text-ink tabular">{brl(s.price)}</span>
                          <span className="flex items-center gap-1 tabular"><Clock className="size-3.5" aria-hidden />{fmtDur(s.dur)}</span>
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="font-bold tabular">{brl(s.price)}</p>
                        <p className="text-sm text-ink-2 tabular">{fmtDur(s.dur)}</p>
                      </div>
                      <Button asChild variant="outline" size="sm" className="hover:border-blue hover:bg-blue-tint">
                        <Link href={`/agendar?unidade=${unit.id}&servico=${s.id}`} aria-label={`Agendar ${s.name}`}>Agendar</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function ProsPanel({ unit, pros }: { unit: Unit; pros: Pro[] }) {
  return (
    <>
      <PanelTitle title="Profissionais" lead={`Quem atende na ${unit.name}. Prefere alguém? Agende direto com ele.`} />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pros.map((p) => (
          <li key={p.id}>
            <SpotlightCard className="flex h-full flex-col p-5" glow={`${p.color}22`}>
              <div className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="grid size-16 place-items-center rounded-full font-wide text-xl font-extrabold text-white ring-4 ring-tile"
                  style={{ background: p.color }}
                >
                  {initials(p.name)}
                </span>
                <div>
                  <h3 className="text-lg font-extrabold">{p.name}</h3>
                  <p className="text-sm text-ink-2">{p.role}</p>
                </div>
              </div>
              <p className="mt-4 text-[0.95rem] text-ink-2">{p.specialties}</p>
              <Button asChild variant="outline" size="sm" className="mt-5">
                <Link href={`/agendar?unidade=${unit.id}&profissional=${p.id}`}>Agendar com {p.name}</Link>
              </Button>
            </SpotlightCard>
          </li>
        ))}
      </ul>
    </>
  );
}

function OffersPanel({ unit, offers, monthly }: { unit: Unit; offers: Offer[]; monthly: boolean }) {
  return (
    <>
      <PanelTitle
        title={monthly ? "Assinaturas" : "Pacotes"}
        lead={monthly ? "Mensalidade fixa para quem não deixa o cabelo passar do ponto." : "Pague uma vez e use quando quiser, dentro da validade."}
      />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {offers.map((o, i) => {
          const featured = monthly && i === offers.length - 1;
          return (
            <li key={o.name}>
              <SpotlightCard className={cn("flex h-full flex-col p-6", featured && "border-2 border-ink")}>
                {featured && <span aria-hidden className="absolute inset-x-0 top-0 h-2 bg-pole-x animate-pole [--pole-period:45.25px]" />}
                <h3 className="text-xl font-extrabold">{o.name}</h3>
                {o.save ? (
                  <span className="mt-2 self-start rounded-full bg-leather-tint px-2.5 py-0.5 text-sm font-bold text-leather">
                    Economize {brl(o.save)}
                  </span>
                ) : null}
                <p className="mt-3 font-semiwide text-3xl font-[850] tabular">
                  {brl(o.price)}
                  {monthly && <span className="text-base font-semibold text-ink-2"> por mês</span>}
                </p>
                <ul className="mt-4 grid gap-1.5 text-ink-2">
                  {o.items.map((it) => (
                    <li key={it} className="flex gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-blue" />{it}</li>
                  ))}
                </ul>
                <Button asChild variant={featured ? "primary" : "outline"} className="mt-6">
                  <a
                    href={waLink(unit.whatsapp, `Olá! Tenho interesse ${monthly ? "na assinatura" : "no pacote"} "${o.name}" da ${SHOP_NAME} (${unit.name}).`)}
                    target="_blank"
                    rel="noopener"
                  >
                    {monthly ? "Assinar pelo WhatsApp" : "Comprar pelo WhatsApp"}
                  </a>
                </Button>
              </SpotlightCard>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function ReviewsPanel({ unit }: { unit: Unit }) {
  return (
    <>
      <PanelTitle title="Avaliações" lead="O que os clientes acham da barbearia." />
      <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-grout bg-surface p-6">
        <p className="font-wide text-7xl font-[850] leading-none tabular">{unit.rating.toFixed(1).replace(".", ",")}</p>
        <div>
          <p className="flex text-[#B7791F]" aria-label={`${unit.rating} de 5 estrelas`}>
            {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-6 fill-current" strokeWidth={0} aria-hidden />)}
          </p>
          <p className="mt-1 text-ink-2">Nota média dos clientes</p>
        </div>
        <div className="w-full border-t border-grout pt-5 sm:ml-auto sm:w-auto sm:border-0 sm:pt-0">
          <p className="mb-3 max-w-[34ch] text-[0.95rem]">Já cortou com a gente? Sua avaliação ajuda outros clientes a escolher.</p>
          <Button asChild variant="outline" size="sm">
            <a href={mapsLink(`${SHOP_NAME} ${unit.street} ${unit.city}`)} target="_blank" rel="noopener">Avaliar no Google</a>
          </Button>
        </div>
      </div>
    </>
  );
}
