import type { Catalog, Hours } from "../types";

// Espelho de supabase/seed.sql, usado só no modo demonstração (sem banco configurado).
const week: Record<number, Hours> = {
  0: null, 1: ["09:00", "19:00"], 2: ["09:00", "19:00"], 3: ["09:00", "19:00"],
  4: ["09:00", "19:00"], 5: ["09:00", "19:00"], 6: ["08:00", "18:00"],
};

export const DEMO_CATALOG: Catalog = {
  units: [
    {
      id: "un1", name: "Unidade 1", area: "Nova Petrópolis",
      street: "Alameda Dom Pedro de Alcântara, 408", city: "São Bernardo do Campo/SP", cep: "09771-281",
      phone: "(11) 95812-3798", whatsapp: "5511958123798", rating: 5.0,
      amenities: ["wifi", "parking", "access", "kids"], hours: week, pros: ["nalio", "rafael", "diego"],
    },
    {
      id: "un2", name: "Unidade 2", area: "Endereço a cadastrar",
      street: "Endereço a cadastrar", city: "São Bernardo do Campo/SP", cep: "",
      phone: "(11) 95812-3798", whatsapp: "5511958123798", rating: 5.0,
      amenities: ["wifi", "kids"], hours: week, pros: ["rafael", "diego"],
    },
  ],
  pros: [
    { id: "nalio", name: "Nálio", role: "Fundador", specialties: "Corte, barba e química", color: "#142033" },
    { id: "rafael", name: "Rafael", role: "Barbeiro", specialties: "Degradê e corte na máquina", color: "#7C1D2A" },
    { id: "diego", name: "Diego", role: "Barbeiro", specialties: "Barba, pigmentação e selagem", color: "#0B63A0" },
  ],
  services: [
    [1, "Corte", null, 4500, 30, "cabelo"],
    [2, "Corte infantil", null, 4500, 30, "cabelo"],
    [3, "Corte + sobrancelha", null, 6000, 30, "combo"],
    [4, "Corte e barba", null, 8000, 40, "combo"],
    [5, "Corte + barba + sobrancelha", null, 9500, 60, "combo"],
    [6, "Barba", null, 4500, 30, "barba"],
    [7, "Barba + sobrancelha", null, 6000, 30, "barba"],
    [8, "Barba + pigmentação", null, 8000, 60, "barba"],
    [9, "Corte + selagem", null, 13000, 60, "quimica"],
    [10, "Corte + selagem + sobrancelha", null, 14000, 60, "quimica"],
    [11, "Corte + barba + selagem", null, 16500, 90, "quimica"],
    [12, "Corte + barba + selagem + sobrancelha", null, 18000, 90, "quimica"],
    [13, "Platinado + corte", null, 22500, 270, "quimica"],
    [14, "Luzes + corte", null, 19500, 180, "quimica"],
    [15, "Depilação combo", "Nariz e orelha", 6500, 30, "cuidado"],
    [16, "Depilação de orelha", null, 3500, 30, "cuidado"],
    [17, "Depilação de nariz", null, 3500, 30, "cuidado"],
    [18, "Matização", null, 3500, 30, "quimica"],
    [19, "Pezinho", null, 2000, 30, "cabelo"],
    [20, "Sobrancelha", null, 1500, 30, "cuidado"],
    [21, "Hidratação", null, 4000, 30, "cuidado"],
    [22, "Limpeza de pele", null, 4000, 30, "cuidado"],
    [23, "Selagem", null, 8500, 30, "quimica"],
    [24, "Corte só na máquina + barba", null, 7000, 30, "combo"],
    [25, "Corte só na máquina", null, 3500, 30, "cabelo"],
  ].map(([id, name, note, price, dur, cat]) => ({
    id: id as number, name: name as string, note: note as string | null,
    price: price as number, dur: dur as number, cat: cat as string,
  })),
};
