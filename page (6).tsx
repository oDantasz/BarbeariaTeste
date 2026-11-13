import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaff, isDemo } from "@/lib/data";
import { DEMO_CATALOG } from "@/lib/data/demo-catalog";
import { LoginForm } from "@/components/painel/login-form";
import { PoleMark } from "@/components/barber-pole";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar no painel", robots: { index: false } };

export default async function EntrarPage() {
  if (await getStaff()) redirect("/painel");
  return (
    <main className="grid min-h-dvh place-items-center bg-ink px-4 py-10">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div aria-hidden className="h-3 bg-pole-x" />
        <div className="p-7">
          <p className="flex items-center gap-2.5 font-semiwide text-lg font-extrabold">
            <PoleMark /> Barbearia do Nálio
          </p>
          <h1 className="mt-6 text-2xl font-extrabold">Área do barbeiro</h1>
          <p className="mb-6 mt-1 text-ink-2">Veja e organize os agendamentos.</p>
          <LoginForm demo={isDemo} demoPros={DEMO_CATALOG.pros.map((p) => ({ id: p.id, name: p.name }))} />
        </div>
      </div>
    </main>
  );
}
