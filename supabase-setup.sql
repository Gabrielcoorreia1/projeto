-- Cole no SQL Editor do Supabase e clique em "Run"

create table if not exists public.tarefas (
  id bigint generated always as identity primary key,
  titulo text not null,
  concluida boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.tarefas enable row level security;

-- Políticas públicas APENAS para demonstração. Não use em produção real.
create policy "Leitura pública" on public.tarefas
  for select using (true);

create policy "Inserção pública" on public.tarefas
  for insert with check (true);

create policy "Atualização pública" on public.tarefas
  for update using (true) with check (true);

insert into public.tarefas (titulo, concluida) values
  ('Criar projeto no Supabase', true),
  ('Configurar variáveis de ambiente na Vercel', false),
  ('Fazer deploy e testar em produção', false);
