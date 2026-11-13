"use client";
import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { signIn, type ActionResult } from "@/app/painel/actions";

function Submit({ children, ...p }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...p}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}

export function LoginForm({ demo, demoPros }: { demo: boolean; demoPros: { id: string; name: string }[] }) {
  const [state, action] = React.useActionState<ActionResult | null, FormData>(signIn, null);

  if (demo) {
    return (
      <div className="grid gap-3">
        <p className="rounded-lg bg-warn-tint px-3 py-2 text-sm font-semibold text-warn">
          Modo demonstração: escolha como quer entrar.
        </p>
        <form action={action}>
          <input type="hidden" name="who" value="owner" />
          <Submit className="w-full" variant="ink">Entrar como dono</Submit>
        </form>
        {demoPros.map((p) => (
          <form key={p.id} action={action}>
            <input type="hidden" name="who" value={p.id} />
            <Submit className="w-full" variant="outline">Entrar como {p.name}</Submit>
          </form>
        ))}
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4" noValidate>
      <div className="grid gap-1.5">
        <label htmlFor="email" className="font-bold">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required
          className="h-12 rounded-xl border-2 border-grout px-3 outline-none focus:border-blue focus:ring-4 focus:ring-blue-tint" />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="password" className="font-bold">Senha</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required
          className="h-12 rounded-xl border-2 border-grout px-3 outline-none focus:border-blue focus:ring-4 focus:ring-blue-tint" />
      </div>
      {state && !state.ok && <p role="alert" className="font-semibold text-danger">{state.message}</p>}
      <Submit size="lg">Entrar</Submit>
    </form>
  );
}
