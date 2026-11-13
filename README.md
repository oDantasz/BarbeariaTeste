# Barbearia do Nálio: site de agendamento + painel

Site em que o cliente escolhe a unidade, os serviços, o profissional e o horário, e painel em que o dono e cada barbeiro veem quem marcou, o quê e quando.

- **Site:** `/` (início), `/agendar` (agendamento em 5 etapas), `/agendamento/[link]` (comprovante, salvar na agenda, cancelar), `/meus-horarios`
- **Painel:** `/painel` (agenda do dia por profissional, números do dia, concluir, falta, cancelar, novo agendamento pelo balcão)
- **Tecnologia:** Next.js 15 + Tailwind 4 + Supabase (banco Postgres + login). Hospedagem na Vercel.

Sem o Supabase configurado, o projeto roda em **modo demonstração**: tudo funciona, mas os dados ficam só na memória e aparece uma faixa amarela avisando.

---

## Colocar no ar (cerca de 30 minutos)

### 1. Criar o banco no Supabase

1. Crie uma conta em supabase.com e clique em **New project**. Escolha a região **South America (São Paulo)**.
2. Antes de rodar, abra `supabase/seed.sql` e troque o que está marcado com `TODO`:
   - **Profissionais:** nomes, especialidades e em quais unidades cada um atende.
   - **Unidade 2:** endereço real ou apague as linhas dela.
3. No Supabase, vá em **SQL Editor > New query**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**.
4. Faça o mesmo com `supabase/seed.sql`.

### 2. Fechar o cadastro público

Em **Authentication > Sign In / Providers**, desligue **Allow new users to sign up**. Assim só quem você cadastrar entra no painel.

### 3. Criar os logins do painel

1. Em **Authentication > Users > Add user**, crie um usuário para o dono e um para cada barbeiro (e-mail e senha, com **Auto Confirm User** marcado).
2. No **SQL Editor**, ligue cada login ao seu papel. Troque os e-mails:

```sql
-- dono: vê tudo, de todas as unidades
insert into public.staff (user_id, role)
select id, 'owner' from auth.users where email = 'dono@exemplo.com';

-- barbeiro: vê só a própria agenda (use o id do profissional do seed.sql)
insert into public.staff (user_id, role, professional_id)
select id, 'barber', 'rafael' from auth.users where email = 'rafael@exemplo.com';
```

### 4. Publicar na Vercel

1. Suba esta pasta para um repositório no GitHub (privado).
2. Na Vercel: **Add New > Project**, importe o repositório.
3. Em **Environment Variables**, cadastre os dois valores que ficam no Supabase em **Project Settings > API**:
   - `NEXT_PUBLIC_SUPABASE_URL`: a Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: a chave **anon public** (ou **publishable**). Nunca use a `service_role`/secret aqui.
4. Clique em **Deploy**. Depois, em **Settings > Domains**, ligue o domínio da barbearia se tiver um.

### 5. Testar

1. Abra o site, faça um agendamento com seu celular e confira o comprovante.
2. Entre em `/painel` com o login do dono e veja o horário na agenda.
3. Marque como concluído e lance um agendamento pelo botão **Novo agendamento**.

---

## Dia a dia

| Quero… | Onde |
|---|---|
| Mudar preço ou duração de um serviço | Supabase > Table Editor > `services` |
| Tirar um serviço do site | `services` > coluna `active` = false |
| Mudar horário de funcionamento | `opening_hours` (weekday 0 = domingo … 6 = sábado) |
| Cadastrar barbeiro | `professionals` + `professional_units` + login (passo 3) |
| Abrir nova unidade | `units` + `opening_hours` + `professional_units` |
| Mudar pacotes e assinaturas | `src/lib/content.ts` (são exemplos: revise antes de publicar) |

## Regras que o banco garante

- Dois clientes nunca ficam no mesmo horário com o mesmo profissional, mesmo se clicarem ao mesmo tempo.
- Só aceita horário dentro do expediente da unidade, em blocos de 30 minutos e com até 60 dias de antecedência.
- No máximo 3 horários futuros por celular, pelo site (evita reservas falsas).
- O cliente cancela pelo link até 2 horas antes. Depois disso, só pelo WhatsApp.
- Quem não está logado nunca vê nome ou telefone de outros clientes. O barbeiro só vê a própria agenda.

## Rodar no computador

```bash
npm install
cp .env.example .env.local   # opcional: sem isso, roda em modo demonstração
npm run dev                  # abre em http://localhost:3000
```

No modo demonstração, o `/painel` deixa entrar como dono ou como qualquer barbeiro, sem senha.

## Componentes do 21st.dev

O visual segue padrões populares do 21st.dev, reescritos com as cores e a fonte da barbearia:

- **Limelight Nav** → abas da página inicial (`src/components/ui/limelight-tabs.tsx`)
- **Spotlight Card** → cartões de serviços, profissionais e pacotes (`src/components/ui/spotlight-card.tsx`)
- **Appointment booking / time slot picker** → etapa de data e horário (`src/components/booking/booking-flow.tsx`)

O projeto já está pronto para o CLI do shadcn (`components.json`). Para trazer outro componente do 21st.dev:

```bash
npx shadcn@latest add "https://21st.dev/r/AUTOR/COMPONENTE?api_key=SUA_CHAVE"
```

Antes de usar, confira a licença na página do componente: muitos aparecem sem licença definida.

## Dados pessoais (LGPD)

O site guarda nome, celular e observação do cliente só para o agendamento e o contato da barbearia. Antes de publicar:

- Inclua uma política de privacidade simples no site (quem guarda, para quê, por quanto tempo e como pedir exclusão).
- Use senhas fortes nos logins do painel e não compartilhe o login do dono.
- Combine por quanto tempo manter agendamentos antigos (dá para apagar periodicamente no Supabase).
