"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, MessageCircle } from "lucide-react";
import { Button } from "../ui/button";
import { downloadICS } from "@/lib/ics";
import { addSaved, removeSaved } from "@/lib/saved";
import { waLink } from "@/lib/utils";
import type { PublicBooking } from "@/lib/types";
import { SHOP_NAME } from "@/lib/content";

export function TicketActions({
  booking, canCancel, unit, proName, when,
}: {
  booking: PublicBooking;
  canCancel: boolean;
  unit: { id: string; name: string; street: string; city: string; whatsapp: string };
  proName: string;
  when: string;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  React.useEffect(() => {
    if (booking.status === "confirmed") addSaved({ token: booking.token, startsAt: booking.startsAt });
  }, [booking]);

  const services = booking.services.map((s) => s.name).join(", ");
  const wa = waLink(unit.whatsapp, `Olá! Agendei pelo site:\n${services}\n${when}\n${unit.name}${proName ? ` com ${proName}` : ""}\nNome: ${booking.customerName}`);

  async function cancel() {
    if (!confirm) return setConfirm(true);
    setBusy(true);
    const r = await fetch(`/api/bookings/${booking.token}/cancel`, { method: "POST" });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    setConfirm(false);
    if (!r.ok) return setMsg({ ok: false, text: j.message ?? "Não foi possível cancelar agora." });
    removeSaved(booking.token);
    setMsg({ ok: true, text: "Horário cancelado. Ele já está livre para outra pessoa." });
    router.refresh();
  }

  return (
    <div className="mt-6 grid gap-3">
      {booking.status === "confirmed" && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => downloadICS({
              id: booking.token, startsAt: booking.startsAt, endsAt: booking.endsAt,
              title: `${SHOP_NAME}: ${services}`, location: `${unit.street}, ${unit.city}`,
              description: `${proName ? `Com ${proName}. ` : ""}Pagamento na barbearia.`,
            })}
          >
            <CalendarPlus aria-hidden />Salvar na agenda
          </Button>
          <Button asChild variant="outline">
            <a href={wa} target="_blank" rel="noopener"><MessageCircle aria-hidden />Avisar no WhatsApp</a>
          </Button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={`/agendar?unidade=${unit.id}`}>Agendar outro horário</Link>
        </Button>
        {canCancel && (
          <>
            <Button variant="danger" onClick={cancel} disabled={busy} aria-describedby={confirm ? "cancel-hint" : undefined}>
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              {confirm ? "Sim, cancelar horário" : "Cancelar horário"}
            </Button>
            {confirm && (
              <Button variant="ghost" onClick={() => setConfirm(false)}>Manter horário</Button>
            )}
          </>
        )}
      </div>
      {confirm && <p id="cancel-hint" className="text-sm text-ink-2">Toque de novo para confirmar o cancelamento.</p>}
      {msg && (
        <p role="status" className={msg.ok ? "font-semibold text-ok" : "font-semibold text-danger"}>{msg.text}</p>
      )}
    </div>
  );
}
