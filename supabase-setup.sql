-- Cole no SQL Editor do Supabase e clique em "Run" (projeto novo, vazio).
-- Alternativa ao caminho manual do roteiro (Parte 3): este script faz tudo de uma vez.

-- ============================================================
-- 1. TABELAS: as três se relacionam com auth.users (tabela de usuários do Supabase Auth)
-- ============================================================

-- 1:1 com auth.users. A PK é também FK: o id do perfil É o id do usuário.
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now()
);

-- 1:N com auth.users: um usuário tem vários projetos.
create table public.projetos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) <= 60),
  created_at timestamptz not null default now()
);

-- 1:N com auth.users e N:1 com projetos (projeto é opcional).
create table public.tarefas (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  projeto_id bigint references public.projetos (id) on delete set null,
  titulo text not null check (char_length(titulo) <= 200),
  concluida boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. TRIGGER: cria o perfil sozinho quando alguém se cadastra
-- ============================================================

-- security definer: roda com permissão do dono da função (ignora RLS),
-- porque no cadastro o usuário ainda não está logado.
-- search_path = '': obriga nomes completos (public.perfis), evita sequestro de schema.
create function public.criar_perfil()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

-- ============================================================
-- 3. ÍNDICE (exemplo didático: com poucas linhas não faz diferença)
-- ============================================================

-- Casa com a consulta do app: filtra por user_id (RLS) e ordena por created_at.
create index tarefas_user_id_created_at_idx on public.tarefas (user_id, created_at);

-- ============================================================
-- 4. RLS: cada usuário só enxerga e mexe nas próprias linhas
-- ============================================================

alter table public.perfis enable row level security;
alter table public.projetos enable row level security;
alter table public.tarefas enable row level security;

-- (select auth.uid()) em vez de auth.uid(): calculado 1x por consulta, não 1x por linha.
create policy "Dono lê perfil" on public.perfis
  for select to authenticated using ((select auth.uid()) = id);

create policy "Dono edita perfil" on public.perfis
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Dono gerencia projetos" on public.projetos
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- O with check também impede ligar a tarefa a um projeto de OUTRA pessoa.
create policy "Dono gerencia tarefas" on public.tarefas
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      projeto_id is null
      or exists (select 1 from public.projetos p where p.id = projeto_id and p.user_id = (select auth.uid()))
    )
  );

-- ============================================================
-- 5. BÔNUS: papel de admin (papel do app, diferente das roles do Postgres)
-- ============================================================

-- Todo mundo nasce 'usuario'. Quem vira admin: troca à mão no Table Editor.
alter table public.perfis add column papel text not null default 'usuario'
  check (papel in ('usuario', 'admin'));

-- O usuário só pode editar o próprio nome. Sem isso, ele mudaria o próprio papel para 'admin'.
revoke update on public.perfis from anon, authenticated;
grant update (nome) on public.perfis to authenticated;

-- security definer: lê perfis sem cair no RLS (evita a política chamar a si mesma).
-- stable: o resultado não muda dentro da mesma consulta.
create function public.eh_admin()
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1 from public.perfis where id = (select auth.uid()) and papel = 'admin'
  );
$$;

-- Políticas se SOMAM: o dono continua vendo as suas, o admin vê também as dos outros.
-- Só leitura: admin não altera nem apaga dados de outras pessoas.
create policy "Admin lê tarefas" on public.tarefas
  for select to authenticated using ((select public.eh_admin()));

create policy "Admin lê projetos" on public.projetos
  for select to authenticated using ((select public.eh_admin()));
