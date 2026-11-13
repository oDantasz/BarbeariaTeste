export type Hours = [string, string] | null; // ["09:00","19:00"] ou fechado

export type Unit = {
  id: string;
  name: string;
  area: string;
  street: string;
  city: string;
  cep: string;
  phone: string;
  whatsapp: string;
  rating: number;
  amenities: string[];
  hours: Record<number, Hours>; // 0 = domingo
  pros: string[];
};

export type Service = {
  id: number;
  name: string;
  note: string | null;
  price: number; // centavos
  dur: number; // minutos
  cat: string;
};

export type Pro = {
  id: string;
  name: string;
  role: string;
  specialties: string;
  color: string;
};

export type Catalog = { units: Unit[]; services: Service[]; pros: Pro[] };

export type BookingStatus = "confirmed" | "done" | "no_show" | "cancelled";

export type BookedService = { id: number; name: string; price_cents: number; duration_min: number };

export type Booking = {
  id: string;
  token: string;
  unitId: string;
  proId: string;
  startsAt: string; // ISO
  endsAt: string;
  customerName: string;
  customerPhone: string;
  notes: string | null;
  services: BookedService[];
  totalCents: number;
  status: BookingStatus;
  source: "site" | "painel";
};

export type PublicBooking = Omit<Booking, "id" | "customerPhone" | "notes" | "source">;

export type Busy = { proId: string; startsAt: string; endsAt: string };

export type Slot = { min: number; proId: string };

export type Staff = { role: "owner" | "barber"; proId: string | null; name: string; email?: string };

export type NewBooking = {
  unitId: string;
  proId: string | null;
  startsAt: string;
  serviceIds: number[];
  name: string;
  phone: string;
  notes?: string;
  source?: "site" | "painel";
};

export class BookingError extends Error {
  constructor(public code: string) {
    super(code);
  }
}
