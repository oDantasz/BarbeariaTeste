import { Clock, CreditCard, MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "../ui/button";
import { PAYMENTS } from "@/lib/content";
import { WD_FULL, localParts, weekday } from "@/lib/time";
import type { Unit } from "@/lib/types";
import { cn, mapsLink, waLink } from "@/lib/utils";

function Card({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-grout bg-surface p-5" aria-label={title}>
      <h2 className="mb-3 flex items-center gap-2 text-[1.0625rem] font-extrabold">
        <Icon className="size-5 text-blue" aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  );
}

export function InfoAside({ unit }: { unit: Unit }) {
  const today = weekday(localParts().date);
  const address = `${unit.street}, ${unit.city}`;
  const hasAddress = Boolean(unit.cep);
  return (
    <aside className="grid content-start gap-4 lg:sticky lg:top-24" aria-label="Informações da unidade">
      <Card icon={MapPin} title="Localização">
        {hasAddress && (
          <div className="mb-4 overflow-hidden rounded-lg border border-grout">
            <iframe
              title={`Mapa da ${unit.name}`}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=16&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-44 w-full grayscale-[.35]"
            />
          </div>
        )}
        <p className="leading-relaxed">
          {unit.street}
          <br />
          {unit.area && hasAddress ? `${unit.area}, ` : ""}{unit.city}
          {unit.cep && <><br /><span className="tabular">CEP {unit.cep}</span></>}
        </p>
        {hasAddress && (
          <Button asChild variant="outline" size="sm" className="mt-4">
            <a href={mapsLink(address)} target="_blank" rel="noopener">Abrir no mapa</a>
          </Button>
        )}
      </Card>

      <Card icon={Clock} title="Horário de atendimento">
        <ul className="tabular">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const h = unit.hours[d];
            return (
              <li key={d} className={cn("flex justify-between border-t border-grout py-1.5 text-[0.95rem] first:border-0", d === today && "font-extrabold")}>
                <span>
                  {WD_FULL[d]}
                  {d === today && <span className="font-medium text-ink-2"> (hoje)</span>}
                </span>
                <span className={cn(!h && "text-ink-2")}>{h ? `${h[0]} às ${h[1]}` : "Fechado"}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card icon={CreditCard} title="Formas de pagamento">
        <ul className="flex flex-wrap gap-2">
          {PAYMENTS.map((p) => (
            <li key={p} className="rounded-full border border-grout px-3 py-1 text-[0.94rem]">{p}</li>
          ))}
        </ul>
      </Card>

      <Card icon={Phone} title="Contato">
        <p className="tabular">{unit.phone}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={waLink(unit.whatsapp)} target="_blank" rel="noopener"><MessageCircle aria-hidden />WhatsApp</a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`tel:+${unit.whatsapp}`}><Phone aria-hidden />Ligar</a>
          </Button>
        </div>
      </Card>
    </aside>
  );
}
