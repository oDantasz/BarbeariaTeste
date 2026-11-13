-- =====================================================================
-- Dados iniciais. Rode depois de schema.sql.
-- Itens com TODO são exemplos: troque pelos dados reais antes de publicar.
-- =====================================================================

insert into public.units (id, name, area, street, city, cep, phone, whatsapp, rating, amenities, sort) values
  ('un1', 'Unidade 1', 'Nova Petrópolis', 'Alameda Dom Pedro de Alcântara, 408',
   'São Bernardo do Campo/SP', '09771-281', '(11) 95812-3798', '5511958123798', 5.0,
   array['wifi','parking','access','kids'], 1)
on conflict (id) do update set name = excluded.name, area = excluded.area, street = excluded.street,
  city = excluded.city, cep = excluded.cep, phone = excluded.phone, whatsapp = excluded.whatsapp,
  rating = excluded.rating, amenities = excluded.amenities, sort = excluded.sort;

-- TODO: unidade 2 de exemplo. Edite o endereço ou apague estas linhas.
insert into public.units (id, name, area, street, city, cep, phone, whatsapp, rating, amenities, sort, active) values
  ('un2', 'Unidade 2', 'Endereço a cadastrar', 'Endereço a cadastrar',
   'São Bernardo do Campo/SP', '', '(11) 95812-3798', '5511958123798', 5.0,
   array['wifi','kids'], 2, true)
on conflict (id) do nothing;

-- Horário: segunda a sexta 09h–19h, sábado 08h–18h, domingo fechado
insert into public.opening_hours (unit_id, weekday, opens, closes)
select u.id, d.weekday, d.opens, d.closes
from public.units u
cross join (values (1,'09:00'::time,'19:00'::time),(2,'09:00','19:00'),(3,'09:00','19:00'),
                   (4,'09:00','19:00'),(5,'09:00','19:00'),(6,'08:00','18:00')) as d(weekday, opens, closes)
on conflict (unit_id, weekday) do update set opens = excluded.opens, closes = excluded.closes;

insert into public.services (id, name, note, price_cents, duration_min, category, sort) values
  (1,  'Corte', null, 4500, 30, 'cabelo', 1),
  (2,  'Corte infantil', null, 4500, 30, 'cabelo', 2),
  (3,  'Corte + sobrancelha', null, 6000, 30, 'combo', 3),
  (4,  'Corte e barba', null, 8000, 40, 'combo', 4),
  (5,  'Corte + barba + sobrancelha', null, 9500, 60, 'combo', 5),
  (6,  'Barba', null, 4500, 30, 'barba', 6),
  (7,  'Barba + sobrancelha', null, 6000, 30, 'barba', 7),
  (8,  'Barba + pigmentação', null, 8000, 60, 'barba', 8),
  (9,  'Corte + selagem', null, 13000, 60, 'quimica', 9),
  (10, 'Corte + selagem + sobrancelha', null, 14000, 60, 'quimica', 10),
  (11, 'Corte + barba + selagem', null, 16500, 90, 'quimica', 11),
  (12, 'Corte + barba + selagem + sobrancelha', null, 18000, 90, 'quimica', 12),
  (13, 'Platinado + corte', null, 22500, 270, 'quimica', 13),
  (14, 'Luzes + corte', null, 19500, 180, 'quimica', 14),
  (15, 'Depilação combo', 'Nariz e orelha', 6500, 30, 'cuidado', 15),
  (16, 'Depilação de orelha', null, 3500, 30, 'cuidado', 16),
  (17, 'Depilação de nariz', null, 3500, 30, 'cuidado', 17),
  (18, 'Matização', null, 3500, 30, 'quimica', 18),
  (19, 'Pezinho', null, 2000, 30, 'cabelo', 19),
  (20, 'Sobrancelha', null, 1500, 30, 'cuidado', 20),
  (21, 'Hidratação', null, 4000, 30, 'cuidado', 21),
  (22, 'Limpeza de pele', null, 4000, 30, 'cuidado', 22),
  (23, 'Selagem', null, 8500, 30, 'quimica', 23),
  (24, 'Corte só na máquina + barba', null, 7000, 30, 'combo', 24),
  (25, 'Corte só na máquina', null, 3500, 30, 'cabelo', 25)
on conflict (id) do update set name = excluded.name, note = excluded.note, price_cents = excluded.price_cents,
  duration_min = excluded.duration_min, category = excluded.category, sort = excluded.sort;
select setval(pg_get_serial_sequence('public.services', 'id'), (select max(id) from public.services));

-- TODO: profissionais de exemplo. Troque nomes e especialidades.
insert into public.professionals (id, name, role, specialties, color, sort) values
  ('nalio',  'Nálio',  'Fundador', 'Corte, barba e química',       '#142033', 1),
  ('rafael', 'Rafael', 'Barbeiro', 'Degradê e corte na máquina',   '#7C1D2A', 2),
  ('diego',  'Diego',  'Barbeiro', 'Barba, pigmentação e selagem', '#0B63A0', 3)
on conflict (id) do update set name = excluded.name, role = excluded.role,
  specialties = excluded.specialties, color = excluded.color, sort = excluded.sort;

insert into public.professional_units (professional_id, unit_id) values
  ('nalio','un1'), ('rafael','un1'), ('diego','un1'), ('rafael','un2'), ('diego','un2')
on conflict do nothing;
