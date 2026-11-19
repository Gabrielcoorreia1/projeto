-- Cole no SQL Editor do Supabase e clique em "Run" (projeto novo, vazio).

-- ============================================================
-- 1. TABELAS: user_id liga cada linha ao usuário do Supabase Auth
-- ============================================================

-- 1:N com auth.users: um usuário tem vários projetos.
create table public.projetos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now()
);

-- 1:N com auth.users e N:1 com projetos (projeto é opcional).
create table public.tarefas (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  projeto_id bigint references public.projetos (id) on delete set null,
  titulo text not null,
  concluida boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. RLS: cada usuário só enxerga e mexe nas próprias linhas
-- ============================================================

alter table public.projetos enable row level security;
alter table public.tarefas enable row level security;

-- "for all" = uma política só cobre select, insert, update e delete.
create policy "Dono gerencia projetos" on public.projetos
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Dono gerencia tarefas" on public.tarefas
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
