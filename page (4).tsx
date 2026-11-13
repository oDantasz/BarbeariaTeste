import { getCatalog } from "@/lib/data";
import { firstFreeDay, openStatus } from "@/lib/availability";
import { relativeDay, toHHMM } from "@/lib/time";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/home/hero";
import { HomeTabs } from "@/components/home/home-tabs";
import { InfoAside } from "@/components/home/info-aside";
import { MobileDock } from "@/components/home/mobile-dock";
import { DemoBanner } from "@/components/demo-banner";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ unidade?: string }> }) {
  const { unidade } = await searchParams;
  const cat = await getCatalog();
  const unit = cat.units.find((u) => u.id === unidade) ?? cat.units[0];
  const free = await firstFreeDay(unit);
  const proNames = Object.fromEntries(cat.pros.map((p) => [p.id, p.name]));
  const book = `/agendar?unidade=${unit.id}`;
  const hint = free ? `${relativeDay(free.date)}, ${toHHMM(free.slots[0].min)}` : "Fale pelo WhatsApp";

  return (
    <>
      <a href="#conteudo" className="fixed left-4 top-[-100px] z-[100] rounded-lg bg-ink px-4 py-2 text-white focus:top-2">
        Pular para o conteúdo
      </a>
      <DemoBanner />
      <SiteHeader units={cat.units} unitId={unit.id} bookHref={book} />
      <main>
        <Hero unit={unit} status={openStatus(unit)} free={free} proNames={proNames} />
        <div id="conteudo" className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-4 pt-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
          <HomeTabs key={unit.id} unit={unit} services={cat.services} pros={cat.pros} />
          <InfoAside unit={unit} />
        </div>
      </main>
      <SiteFooter unit={unit} />
      <MobileDock href={book} hint={hint} />
    </>
  );
}
