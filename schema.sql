-- =====================================================================
-- Barbearia do Nálio — banco de dados (Supabase / Postgres)
-- Rode este arquivo inteiro no Supabase: SQL Editor > New query > Run.
-- Depois rode seed.sql para cadastrar unidades, serviços e profissionais.
-- =====================================================================

create extension if not exists btree_gist;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Cadastro
-- ---------------------------------------------------------------------
create table if not exists public.units (
  id          text primary key,             -- ex.: 'un1'
  name        text not null,                -- 'Unidade 1'
  area        text not null default '',     -- bairro
  street      text not null,
  city        text not null,
  cep         text not null default '',
  phone       text not null default '',
  whatsapp    text not null default '',     -- só números com DDI: 5511958123798
  rating      numeric(2,1) not null default 5.0,
  amenities   text[] not null default '{}', -- wifi, parking, access, kids
  active      boolean not null default true,
  sort        int not null default 0
);

create table if not exists public.opening_hours (
  unit_id  text references public.units(id) on delete cascade,
  weekday  smallint check (weekday between 0 and 6), -- 0 = domingo
  opens    time not null,
  closes   time not null check (closes > opens),
  primary key (unit_id, weekday)
);

create table if not exists public.services (
  id            serial primary key,
  name          text not null,
  note          text,
  price_cents   int not null check (price_cents >= 0),
  duration_min  int not null check (duration_min > 0),
  category      text not null,  -- cabelo, barba, combo, quimica, cuidado
  sort          int not null default 0,
  active        boolean not null default true
);

create table if not exists public.professionals (
  id           text primary key,          -- ex.: 'nalio'
  name         text not null,
  role         text not null default 'Barbeiro',
  specialties  text not null default '',
  color        text not null default '#142033',
  active       boolean not null default true,
  sort         int not null default 0
);

create table if not exists public.professional_units (
  professional_id text references public.professionals(id) on delete cascade,
  unit_id         text references public.units(id) on delete cascade,
  primary key (professional_id, unit_id)
);

-- Quem acessa o painel. role 'owner' vê tudo; 'barber' vê só a própria agenda.
create table if not exists public.staff (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  role             text not null check (role in ('owner','barber')),
  professional_id  text references public.professionals(id) on delete set null,
  check (role = 'owner' or professional_id is not null)
);

-- ---------------------------------------------------------------------
-- Agendamentos
-- ---------------------------------------------------------------------
create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  token            uuid not null unique default gen_random_uuid(), -- link privado do cliente
  unit_id          text not null references public.units(id),
  professional_id  text not null references public.professionals(id),
  starts_at        timestamptz not null,
  ends_at          timestamptz not null check (ends_at > starts_at),
  customer_name    text not null check (length(trim(customer_name)) >= 2),
  customer_phone   text not null check (length(customer_phone) between 10 and 13),
  notes            text,
  services         jsonb not null,   -- cópia dos serviços no momento da reserva
  total_cents      int not null,
  status           text not null default 'confirmed'
                   check (status in ('confirmed','done','no_show','cancelled')),
  source           text not null default 'site' check (source in ('site','painel')),
  created_at       timestamptz not null default now(),
  cancelled_at     timestamptz,
  -- impede dois agendamentos do mesmo profissional no mesmo horário
  constraint bookings_no_overlap exclude using gist (
    professional_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status <> 'cancelled')
);
create index if not exists bookings_starts_idx on public.bookings (starts_at);
create index if not exists bookings_phone_idx on public.bookings (customer_phone);

-- ---------------------------------------------------------------------
-- Funções de permissão
-- ---------------------------------------------------------------------
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid() and role = 'owner');
$$;

create or replace function public.my_professional() returns text
language sql stable security definer set search_path = public as $$
  select professional_id from staff where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.units              enable row level security;
alter table public.opening_hours      enable row level security;
alter table public.services           enable row level security;
alter table public.professionals      enable row level security;
alter table public.professional_units enable row level security;
alter table public.staff              enable row level security;
alter table public.bookings           enable row level security;

-- catálogo: leitura pública
drop policy if exists "catalogo publico" on public.units;
create policy "catalogo publico" on public.units for select using (active);
drop policy if exists "catalogo publico" on public.opening_hours;
create policy "catalogo publico" on public.opening_hours for select using (true);
drop policy if exists "catalogo publico" on public.services;
create policy "catalogo publico" on public.services for select using (active);
drop policy if exists "catalogo publico" on public.professionals;
create policy "catalogo publico" on public.professionals for select using (active);
drop policy if exists "catalogo publico" on public.professional_units;
create policy "catalogo publico" on public.professional_units for select using (true);

-- equipe: cada um vê o próprio cadastro; o dono vê todos
drop policy if exists "equipe le" on public.staff;
create policy "equipe le" on public.staff for select to authenticated
  using (user_id = auth.uid() or public.is_owner());

-- agendamentos: ninguém de fora lê a tabela; equipe vê conforme o papel
drop policy if exists "equipe le agendamentos" on public.bookings;
create policy "equipe le agendamentos" on public.bookings for select to authenticated
  using (public.is_owner() or professional_id = public.my_professional());

drop policy if exists "equipe altera agendamentos" on public.bookings;
create policy "equipe altera agendamentos" on public.bookings for update to authenticated
  using (public.is_owner() or professional_id = public.my_professional())
  with check (public.is_owner() or professional_id = public.my_professional());

-- ---------------------------------------------------------------------
-- Funções públicas (chamadas pelo site). Rodam com permissão elevada,
-- mas só devolvem o mínimo necessário — nunca nome/telefone de outros clientes.
-- ---------------------------------------------------------------------

-- Horários ocupados dos profissionais de uma unidade num dia (sem dados de cliente)
create or replace function public.busy_slots(p_unit text, p_day date)
returns table (professional_id text, starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select b.professional_id, b.starts_at, b.ends_at
  from bookings b
  join professional_units pu on pu.professional_id = b.professional_id and pu.unit_id = p_unit
  where b.status <> 'cancelled'
    and b.starts_at < ((p_day + 1)::timestamp at time zone 'America/Sao_Paulo')
    and b.ends_at   > ((p_day)::timestamp     at time zone 'America/Sao_Paulo');
$$;

-- Cria um agendamento validando tudo no servidor.
-- p_professional nulo = "qualquer profissional" (escolhe o primeiro livre).
create or replace function public.create_booking(
  p_unit text,
  p_professional text,
  p_starts_at timestamptz,
  p_service_ids int[],
  p_name text,
  p_phone text,
  p_notes text default null,
  p_source text default 'site'
) returns table (token uuid, professional_id text, starts_at timestamptz, ends_at timestamptz, total_cents int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_count int := 0;
  v_services jsonb;
  v_total int;
  v_dur int;
  v_ends timestamptz;
  v_local timestamp := p_starts_at at time zone 'America/Sao_Paulo';
  v_hours opening_hours%rowtype;
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_pro text;
  v_token uuid;
  v_source text := case when p_source = 'painel' and auth.uid() is not null
                         and exists (select 1 from staff where user_id = auth.uid())
                        then 'painel' else 'site' end;
begin
  if p_service_ids is null or cardinality(p_service_ids) = 0 then
    raise exception 'sem_servico' using hint = 'Escolha pelo menos um serviço.';
  end if;

  select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'price_cents', s.price_cents, 'duration_min', s.duration_min) order by s.sort),
         sum(s.price_cents), sum(s.duration_min)
    into v_services, v_total, v_dur
  from services s where s.id = any(p_service_ids) and s.active;

  if v_services is null or jsonb_array_length(v_services) <> cardinality(array(select distinct unnest(p_service_ids))) then
    raise exception 'servico_invalido';
  end if;

  -- reserva em blocos de 30 min
  v_dur := ceil(v_dur / 30.0)::int * 30;
  v_ends := p_starts_at + make_interval(mins => v_dur);

  if p_starts_at < now() + interval '15 minutes' and v_source = 'site' then
    raise exception 'horario_passado';
  end if;
  if p_starts_at > now() + interval '60 days' then
    raise exception 'horario_distante';
  end if;
  if extract(minute from v_local)::int % 30 <> 0 then
    raise exception 'horario_invalido';
  end if;

  select * into v_hours from opening_hours oh
   where oh.unit_id = p_unit and oh.weekday = extract(dow from v_local)::int;
  if not found or v_local::time < v_hours.opens
     or (v_ends at time zone 'America/Sao_Paulo')::time > v_hours.closes
     or (v_ends at time zone 'America/Sao_Paulo')::date <> v_local::date then
    raise exception 'fora_do_horario';
  end if;

  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'nome_invalido'; end if;
  if length(v_phone) not between 10 and 13 then raise exception 'telefone_invalido'; end if;

  -- trava contra abuso: no máximo 3 horários futuros por celular (site)
  if v_source = 'site' and (select count(*) from bookings b
       where b.customer_phone = v_phone and b.status = 'confirmed' and b.starts_at > now()) >= 3 then
    raise exception 'limite_agendamentos';
  end if;

  -- profissionais candidatos
  for v_pro in
    select p.id from professionals p
    join professional_units pu on pu.professional_id = p.id and pu.unit_id = p_unit
    where p.active and (p_professional is null or p.id = p_professional)
    order by p.sort
  loop
    v_count := v_count + 1;
    begin
      insert into bookings (unit_id, professional_id, starts_at, ends_at, customer_name, customer_phone, notes, services, total_cents, source)
      values (p_unit, v_pro, p_starts_at, v_ends, trim(p_name), v_phone, nullif(trim(coalesce(p_notes,'')), ''), v_services, v_total, v_source)
      returning bookings.token into v_token;
      return query select v_token, v_pro, p_starts_at, v_ends, v_total;
      return;
    exception when exclusion_violation then
      -- ocupado: tenta o próximo profissional
    end;
  end loop;

  if v_count = 0 then
    raise exception 'profissional_invalido';
  end if;
  raise exception 'horario_ocupado';
end $$;

-- Dados de um agendamento pelo link privado do cliente
create or replace function public.get_booking(p_token uuid)
returns table (
  token uuid, unit_id text, professional_id text, starts_at timestamptz, ends_at timestamptz,
  customer_name text, services jsonb, total_cents int, status text
)
language sql stable security definer set search_path = public as $$
  select b.token, b.unit_id, b.professional_id, b.starts_at, b.ends_at,
         b.customer_name, b.services, b.total_cents, b.status
  from bookings b where b.token = p_token;
$$;

-- Cliente cancela pelo link (até 2 horas antes)
create or replace function public.cancel_booking(p_token uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare v bookings%rowtype;
begin
  select * into v from bookings where token = p_token for update;
  if not found then raise exception 'nao_encontrado'; end if;
  if v.status <> 'confirmed' then raise exception 'nao_cancelavel'; end if;
  if v.starts_at < now() + interval '2 hours' then raise exception 'cancelamento_tarde'; end if;
  update bookings set status = 'cancelled', cancelled_at = now() where id = v.id;
  return 'cancelled';
end $$;

-- Permissões das funções
revoke all on function public.busy_slots(text, date) from public;
revoke all on function public.create_booking(text, text, timestamptz, int[], text, text, text, text) from public;
revoke all on function public.get_booking(uuid) from public;
revoke all on function public.cancel_booking(uuid) from public;
grant execute on function public.busy_slots(text, date) to anon, authenticated;
grant execute on function public.create_booking(text, text, timestamptz, int[], text, text, text, text) to anon, authenticated;
grant execute on function public.get_booking(uuid) to anon, authenticated;
grant execute on function public.cancel_booking(uuid) to anon, authenticated;
