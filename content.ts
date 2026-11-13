// Textos e ofertas do site que não ficam no banco.
// TODO: pacotes e assinaturas são exemplos — ajuste nomes, preços e regras.

export const SHOP_NAME = "Barbearia do Nálio";

export const CATEGORIES: Record<string, string> = {
  cabelo: "Cabelo",
  barba: "Barba",
  combo: "Combos",
  quimica: "Selagem, luzes e platinado",
  cuidado: "Sobrancelha, pele e depilação",
};

export const AMENITIES: Record<string, { label: string; text: string }> = {
  wifi: { label: "Wi-fi", text: "Wi-fi liberado para clientes. Peça a senha na recepção." },
  parking: { label: "Estacionamento", text: "Unidade com estacionamento para clientes." },
  access: { label: "Acessibilidade", text: "Unidade com acessibilidade para pessoas com mobilidade reduzida." },
  kids: { label: "Atende crianças", text: "Atendemos crianças. Agende o serviço Corte infantil." },
};

export const PAYMENTS = ["PIX", "Cartão de crédito", "Cartão de débito", "Dinheiro"];

export type Offer = { name: string; price: number; items: string[]; save?: number };

export const PACKS: Offer[] = [
  { name: "4 cortes", price: 16000, items: ["4 cortes à sua escolha", "Válido por 90 dias"], save: 2000 },
  { name: "4 cortes e barbas", price: 29000, items: ["4 sessões de corte e barba", "Válido por 90 dias"], save: 3000 },
  { name: "Selagem completa", price: 30000, items: ["2 sessões de corte + selagem", "1 hidratação"] },
];

export const SUBS: Offer[] = [
  { name: "Clube corte", price: 8900, items: ["Cortes ilimitados no mês", "Pezinho incluso"] },
  { name: "Clube corte e barba", price: 14900, items: ["Corte e barba ilimitados no mês", "Sobrancelha inclusa"] },
];

export const CANCEL_HOURS = 2;
