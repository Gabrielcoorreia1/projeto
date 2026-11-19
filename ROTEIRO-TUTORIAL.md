# Roteiro: app completo com Next.js + Supabase

> **Público:** quem quer colocar um app real no ar, não só "ver funcionando".
> **Duração estimada:** 25 min. O deploy na Vercel fica num vídeo separado.
> **Convenções:** trechos em _itálico_ são sugestões de fala. 🎬 = ação na tela. 💡 = conceito pra explicar. ⚠️ = cuidado de produção.

---

## Índice

0. Abertura: o que vamos construir e por quê
1. Entendendo as peças: o que é Supabase e como ele conversa com o app
2. Preparação do projeto e GitHub
3. Banco, Auth e chaves no Supabase (tabelas, relações e RLS)
4. Antes de colocar SEU app em produção: checklist do mundo real
5. Encerramento
6. Anexo: problemas comuns e soluções

---

## Parte 0: Abertura (1 min)

🎬 Mostrar o app final rodando em `localhost:3000`: criar conta, criar um projeto, adicionar uma tarefa nele, marcar como concluída, recarregar e mostrar que os dados continuam lá. Abrir numa aba anônima com outra conta e mostrar que ela **não vê** as tarefas da primeira.

_"Esse é um app de tarefas simples, mas ele tem o que um app de verdade precisa: login de usuários, um banco de dados com tabelas relacionadas e cada usuário vendo só os próprios dados. Tudo isso sem escrever back-end e começando de graça."_

🎬 Mostrar rapidamente o índice acima.

---

## Parte 1: Entendendo as peças (4 min)

### 1.1 O problema que estamos resolvendo

_"Todo app web tem basicamente três necessidades:"_

1. **Um lugar pra guardar dados** (banco de dados).
2. **Um jeito seguro de acessar esses dados** (back-end/API).
3. **Um lugar pra publicar o site** (hospedagem).

_"O Supabase cuida de 1 e 2. A hospedagem fica pro vídeo de deploy na Vercel."_

### 1.2 O que é o Supabase

💡 **Supabase** é um back-end pronto ("Backend as a Service"). Por baixo, é um banco **PostgreSQL** completo, com ferramentas em volta:

| Recurso | O que é | Usamos neste vídeo? |
|---|---|---|
| **Database** | Um PostgreSQL de verdade | ✅ Sim (2 tabelas) |
| **API automática** | Cada tabela vira automaticamente uma API REST | ✅ Sim (via `supabase-js`) |
| **Row Level Security (RLS)** | Regras dentro do banco que dizem quem pode ler/escrever cada linha | ✅ Sim |
| **Auth** | Login com e-mail, Google, GitHub etc. Cria a tabela `auth.users` | ✅ Sim (e-mail e senha) |
| **Storage / Realtime / Edge Functions** | Arquivos, mudanças ao vivo, código de servidor | ❌ |

_"O pulo do gato: você cria uma tabela e **já tem uma API pronta** pra ela. O front-end conversa direto com o Supabase, sem servidor Node no meio."_

**Por que Supabase?** É **Postgres puro** (se sair, leva o banco junto), tem **plano gratuito** bom e SQL vale pra vida toda.

### 1.3 Como as peças se encaixam

🎬 Mostrar este diagrama na tela:

```
┌──────────────┐
│  Next.js     │  npm run dev (localhost:3000)
└──────┬───────┘
       │ entrega HTML/JS
       ▼
┌──────────────┐
│  Navegador   │
│ do usuário   │
└──────┬───────┘
       │ supabase-js (HTTPS + publishable key + token do login)
       ▼
┌──────────────┐
│   Supabase   │  API + RLS + PostgreSQL
└──────────────┘
```

_"O **próprio navegador** conversa com o Supabase. Por isso a segurança não depende de esconder a chave. Ela depende do **login** + das regras de RLS dentro do banco."_

### 1.4 Conceitos que vão aparecer no vídeo

- **Variáveis de ambiente:** configurações (URLs, chaves) que ficam **fora do código**.
- **`NEXT_PUBLIC_`:** prefixo do Next.js que diz "essa variável pode ir para o navegador". ⚠️ Sem o prefixo, o front-end recebe `undefined`.
- **publishable key:** chave **pública** do Supabase. Só permite o que as políticas de RLS liberarem.
- **secret key:** chave **secreta** que **ignora o RLS**. ⚠️ Nunca no front-end, nunca com `NEXT_PUBLIC_`, nunca no GitHub.
- **RLS:** "porteiro" dentro do banco. Com RLS ligado e nenhuma política, ninguém acessa nada.

---

## Parte 2: Preparação do projeto e GitHub (4 min)

### 2.1 Tour pelo projeto

🎬 Abrir o projeto no editor:

| Arquivo | Pra que serve |
|---|---|
| `package.json` | Dependências: `next`, `react`, `react-dom` e `@supabase/supabase-js` |
| `app/page.js` | Tela de login/cadastro e, depois de entrar, projetos e tarefas do usuário |
| `services/` | Requisições ao Supabase: `tarefas.js`, `projetos.js` e `auth.js`. A tela só chama `tarefasService.listar()` |
| `utils/supabase.js` | Cria **um único cliente** do Supabase lendo as variáveis de ambiente |
| `supabase-setup.sql` | Script que cria as 2 tabelas e as regras de segurança (atalho da Parte 3) |
| `.env.example` | **Modelo** das variáveis. Vai pro GitHub. |
| `.env.local` | Os **valores reais**. **Não** vai pro GitHub. |

🎬 Abrir `.gitignore` e destacar `.env*.local`:

_"Essa linha impede suas chaves de irem pro GitHub. Existem robôs varrendo o GitHub atrás de chave vazada o tempo todo."_

### 2.2 Rodar localmente

```bash
npm install
npm run dev
```

> Ainda não abra o navegador: sem o `.env.local` preenchido o app dá erro (`supabaseUrl is required`). A gente preenche na 3.6.

### 2.3 Subir para o GitHub

🎬 github.com → **New repository** → `demo-supabase` → **sem** README, .gitignore ou licença → **Create**.

```bash
git init
git add .
git status        # 👀 conferir: .env.local NÃO pode aparecer na lista
git commit -m "Projeto inicial"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/demo-supabase.git
git push -u origin main
```

🎬 Mostrar que **o `.env.example` está lá e o `.env.local` não**.

---

## Parte 3: Banco, Auth e chaves no Supabase (10 min)

### 3.1 Criar o projeto

🎬 https://supabase.com → **New project**:
- **Name:** `demo-tarefas`
- **Database Password:** gerar uma senha forte e guardar.
- **Region:** a mais próxima dos **seus usuários** (ex.: _South America (São Paulo)_). Não dá pra trocar depois.
- **Plan:** Free.

### 3.2 O modelo: 2 tabelas ligadas ao Auth

💡 _"O Supabase já tem uma tabela de usuários pronta: `auth.users`. A gente não mexe nela: cria as nossas tabelas e **aponta** pra ela com chave estrangeira."_

- **PK (chave primária):** a identidade da linha. _"O CPF da linha."_
- **FK (chave estrangeira):** coluna que **aponta para a PK de outra tabela**. O banco garante que o valor existe lá.

🎬 Mostrar este diagrama na tela:

```
           ┌────────────────────┐
           │     auth.users     │   (gerenciada pelo Supabase Auth)
           │  id uuid  PK       │
           └─────────┬──────────┘
          ┌──────────┴───────────┐
          │ 1:N                  │ 1:N
          ▼                      ▼
┌──────────────────┐   ┌───────────────────────┐
│ public.projetos  │   │    public.tarefas     │
│ id bigint PK     │   │ id bigint PK          │
│ user_id uuid FK  │   │ user_id uuid FK       │
│ nome             │◀──┤ projeto_id bigint FK  │ N:1 (opcional)
│ created_at       │   │ titulo, concluida     │
└──────────────────┘   │ created_at            │
                       └───────────────────────┘
```

- `on delete cascade`: apagou o usuário → somem os projetos e tarefas dele.
- `on delete set null`: apagou o projeto → a tarefa continua, "sem projeto".

### 3.3 Configurar o Auth

🎬 **Authentication → Sign In / Providers** → **Email** habilitado → **desligar "Confirm email"** → Save.

_"O e-mail grátis tem limite baixo de envios, então na gravação a gente desliga."_ ⚠️ _"Em produção, religue e configure um SMTP próprio."_

### 3.4 Criar as tabelas e o RLS (SQL Editor)

🎬 **SQL Editor** → **New query** → colar o `supabase-setup.sql` → **Run**:

```sql
create table public.projetos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now()
);

create table public.tarefas (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  projeto_id bigint references public.projetos (id) on delete set null,
  titulo text not null,
  concluida boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.projetos enable row level security;
alter table public.tarefas enable row level security;

create policy "Dono gerencia projetos" on public.projetos
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Dono gerencia tarefas" on public.tarefas
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Explicar:
- `default auth.uid()`: `auth.uid()` devolve o id de quem está logado. O front-end nem manda o `user_id`, o banco preenche.
- `enable row level security`: liga o porteiro. Sem política, ninguém acessa nada.
- `for all`: **uma política só** cobre select, insert, update e delete.
- `to authenticated`: só vale pra quem está logado.
- `using`: quais linhas a pessoa **enxerga e altera**.
- `with check`: o que ela pode **gravar**. Impede criar linha com `user_id` de outra pessoa.

🎬 Mostrar **Database → Schema Visualizer** com as setas das FKs e **Authentication → Policies** com as 2 políticas.

> Prefere sem SQL? Dá pra criar as tabelas no **Table Editor** e as políticas em **Authentication → Policies → Create policy** (Command `ALL`, Role `authenticated`, USING e WITH CHECK = `auth.uid() = user_id`). O resultado é o mesmo.

### 3.5 Pegar as chaves da API

🎬 Botão **Connect** no topo do painel (ou **Project Settings → API Keys**):

| No painel | Vai pra | Usamos? |
|---|---|---|
| **Project URL** (`https://xxxx.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` | ✅ |
| **Publishable key** (`sb_publishable_...`) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ |
| **Secret key** (`sb_secret_...`) | Só código de servidor. **Ignora o RLS.** | ❌ |

_"A publishable sozinha não dá acesso a nada: só identifica o projeto. Quem decide o que cada um vê é o login + RLS. A secret é a chave mestra: jamais no front-end."_

### 3.6 Conectar o app local

🎬 Abrir `.env.local` e colar:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

> ⚠️ Os nomes têm que ser **exatamente** esses, com `NEXT_PUBLIC_`. Sem aspas e sem espaços em volta do `=`.

🎬 **Ctrl+C** e `npm run dev` de novo. _"O Next.js só lê o `.env.local` quando inicia."_

### 3.7 Provar tudo funcionando

🎬 App e painel do Supabase lado a lado:

1. **Criar conta** "ana@teste.com" → entra direto e mostra "Olá, ana@teste.com". 🎬 **Authentication → Users** tem a Ana.
2. Criar o projeto "Trabalho" → linha em `projetos` com o `user_id` da Ana preenchido sozinho.
3. Criar a tarefa "Gravar vídeo" no projeto "Trabalho" → aparece com a etiqueta do projeto.
   - 💡 _"A consulta é `select('*, projetos(nome)')`. O Supabase seguiu a FK e trouxe o nome do projeto junto. Um join sem escrever SQL."_
4. **Sair** → criar a conta "bruno@teste.com" → lista **vazia**.
   - _"Mesma tabela, mesma chave, mas o Bruno não vê nada da Ana. O código **não tem nenhum filtro por usuário**: quem filtra é o banco, pelo RLS."_

---

## Parte 4: Antes de colocar SEU app em produção (4 min)

- **Religar "Confirm email"** e configurar **SMTP próprio** (Resend, SendGrid, SES).
- **Toda tabela nova com RLS ligado** e política `auth.uid() = user_id`. Conferir o **Security Advisor**.
- **Secret key só no servidor.** Se vazar: gerar outra em Project Settings → API Keys.
- **Ambientes separados:** um projeto Supabase pra dev e outro pra prod. Mudanças de banco via **migrações** (`supabase migration new`, `supabase db push`).
- **Plano Free pausa** após cerca de 1 semana sem uso e não tem backup automático. Pra clientes, avalie o **Pro**.
- **Backup manual:** `supabase db dump` ou `pg_dump`.

---

## Parte 5: Encerramento (1 min)

_"Recapitulando:"_

1. _"O **Supabase** nos deu login e um banco Postgres com 2 tabelas ligadas ao usuário por **chaves estrangeiras**, protegidas por RLS, sem escrever back-end."_
2. _"O app conversa direto com o Supabase, e quem protege os dados é o login + RLS, não esconder a chave."_
3. _"Pra produção: confirmação de e-mail, ambientes separados e o plano certo."_

_"O código está no link da descrição. No próximo vídeo, a gente publica esse app na Vercel. Até lá!"_

---

## Anexo: problemas comuns e soluções

| Sintoma | Causa provável | Solução |
|---|---|---|
| `supabaseUrl is required` | `.env.local` vazio, nomes **sem `NEXT_PUBLIC_`** ou servidor não reiniciado | Conferir os nomes (3.6) e reiniciar `npm run dev` |
| `supabaseUrl is required` no build da Vercel | Variáveis não cadastradas na Vercel ou com nome errado | Settings → Environment Variables com os mesmos nomes da 3.6 → Redeploy |
| `relation "public.tarefas" does not exist` | Script não rodado ou rodado em outro projeto | Rodar `supabase-setup.sql` no projeto certo |
| `new row violates row-level security policy` | Falta política ou usuário não logado | Conferir 3.4 |
| Lista vazia, mas há dados no Table Editor | Dados de **outro usuário** (RLS funcionando!) | Entrar com o dono das linhas |
| Cadastro diz "Confirme pelo link" e não chega e-mail | "Confirm email" ligado + limite do e-mail grátis | Desligar para a demo (3.3) |
| `Invalid API key` | Chave copiada errada | Copiar de novo a publishable key |
| `... already exists` ao rodar o script | Script já executado | Rodar num projeto limpo |
| App parou depois de dias parado | Projeto Free pausado | Painel do Supabase → **Restore project** |
| `.env.local` apareceu no `git status` | `.gitignore` ausente ou alterado | Conferir `.gitignore`; se já commitou, **gerar chaves novas** |
