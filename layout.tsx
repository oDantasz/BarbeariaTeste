import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Barbearia do Nálio · Agende seu horário", template: "%s · Barbearia do Nálio" },
  description: "Agende corte, barba e tratamentos na Barbearia do Nálio, em São Bernardo do Campo.",
};

export const viewport: Viewport = { themeColor: "#0B63A0", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
