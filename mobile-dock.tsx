"use client";
import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "../ui/button";

// Barra inferior no celular: aparece quando o botão principal do topo sai da tela.
export function MobileDock({ href, hint }: { href: string; hint: string }) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const el = document.getElementById("hero-cta");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          exit={{ y: "110%" }}
          transition={{ type: "spring", stiffness: 400, damping: 38 }}
          className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-grout bg-surface/95 px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden"
        >
          <p className="flex-1 text-sm leading-tight text-ink-2">
            Próximo livre
            <strong className="block text-base text-ink tabular">{hint}</strong>
          </p>
          <Button asChild>
            <Link href={href}>Agendar horário</Link>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
