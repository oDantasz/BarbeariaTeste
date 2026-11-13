import Link from "next/link";
import { PoleMark } from "./barber-pole";
import type { Unit } from "@/lib/types";
import { waLink } from "@/lib/utils";

export function SiteFooter({ unit }: { unit: Unit }) {
  return (
    <footer className="relative mt-16 bg-ink text-white">
      <div aria-hidden className="h-2 bg-pole-x" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-2.5 font-semiwide text-xl font-extrabold">
            <PoleMark className="ring-white/80" />
            Barbearia do Nálio
          </p>
          <p className="mt-3 max-w-[36ch] text-white/75">
            {unit.street}
            {unit.cep ? `, ${unit.area}` : ""}
            <br />
            {unit.city}
          </p>
        </div>
        <nav aria-label="Atalhos">
          <h2 className="mb-3 font-bold">Atalhos</h2>
          <ul className="grid gap-2 text-white/80">
            <li><Link className="hover:text-white" href={`/agendar?unidade=${unit.id}`}>Agendar horário</Link></li>
            <li><Link className="hover:text-white" href="/meus-horarios">Meus horários</Link></li>
            <li><a className="hover:text-white" href={waLink(unit.whatsapp)} target="_blank" rel="noopener">WhatsApp {unit.phone}</a></li>
          </ul>
        </nav>
        <div>
          <h2 className="mb-3 font-bold">Equipe</h2>
          <Link className="text-white/80 hover:text-white" href="/painel">Área do barbeiro</Link>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-5 text-center text-sm text-white/60">
        © {new Date().getFullYear()} Barbearia do Nálio
      </p>
    </footer>
  );
}
