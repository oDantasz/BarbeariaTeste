import Link from "next/link";
import { BarberPole } from "@/components/barber-pole";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10 text-center">
      <div className="grid justify-items-center gap-6">
        <BarberPole size="sm" />
        <h1 className="font-wide text-4xl font-[850]">Página não encontrada</h1>
        <p className="max-w-[40ch] text-ink-2">O link pode estar incompleto. Se for de um agendamento, confira a mensagem de confirmação.</p>
        <Button asChild><Link href="/">Voltar ao início</Link></Button>
      </div>
    </main>
  );
}
