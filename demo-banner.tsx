import { isDemo } from "@/lib/data";

// Aparece só enquanto o Supabase não estiver configurado.
export function DemoBanner() {
  if (!isDemo) return null;
  return (
    <div className="bg-warn-tint px-4 py-2 text-center text-sm font-semibold text-warn">
      Modo demonstração: os agendamentos ficam só na memória. Configure o Supabase para valer de verdade.
    </div>
  );
}
