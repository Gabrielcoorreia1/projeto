# Roteiro: app completo com Next.js + Supabase

> **Público:** quem quer colocar um app real no ar, não só "ver funcionando".
> **Duração estimada:** 40 min. O deploy na Vercel fica num vídeo separado.
> **Convenções:** trechos em _itálico_ são sugestões de fala. 🎬 = ação na tela. 💡 = conceito pra explicar. ⚠️ = cuidado de produção.

---

## Índice

0. Abertura: o que vamos construir e por quê
1. Entendendo as peças: o que é Supabase e como ele conversa com o app
2. Preparação do projeto e GitHub
3. Banco, Auth e chaves no Supabase (tabelas manuais, relações, trigger, índice, RLS, roles e admin)
4. Antes de colocar SEU app em produção: checklist do mundo real
5. Encerramento
6. Anexo: problemas comuns e soluções

---

## Parte 0: Abertura (1 min)

🎬 Mostrar o app final rodando em `localhost:3000`: criar conta, criar um projeto, adicionar uma tarefa nele, marcar como concluída, recarregar e mostrar que os dados continuam lá. Abrir numa aba anônima com outra conta e mostrar que ela **não vê** as tarefas da primeira.

_"Esse é um app de tarefas simples, mas ele tem tudo o que um app de verdade precisa: login de usuários, um banco de dados de verdade com tabelas relacionadas, cada usuário vendo só os próprios dados, E tudo isso sem escrever back-end e começando de graça."_

_"A ideia não é só fazer funcionar. Quero que você saia daqui entendendo **o que** cada peça faz, **por que** a gente usa cada uma e **o que muda** quando você for colocar o seu próprio projeto em produção."_

🎬 Mostrar rapidamente o índice acima.

---

## Parte 1: Entendendo as peças (5 min)

> Essa parte é a mais importante pra quem nunca usou essas ferramentas. Vale mostrar um diagrama simples na tela.

### 1.1 O problema que estamos resolvendo

_"Todo app web tem basicamente três necessidades:"_

1. **Um lugar pra guardar dados** (banco de dados): as tarefas precisam continuar existindo depois que você fecha o navegador.
2. **Um jeito seguro de acessar esses dados** (back-end/API): o navegador não pode falar com o banco de qualquer jeito.
3. **Um lugar pra publicar o site** (hospedagem): pra qualquer pessoa acessar por uma URL.

_"Antigamente você alugava um servidor, instalava banco, configurava Nginx, certificado SSL, fazia deploy por FTP ou SSH... Hoje dá pra terceirizar essas três coisas pra serviços especializados. O Supabase cuida de 1 e 2. A hospedagem (3) fica pro vídeo de deploy na Vercel."_

### 1.2 O que é o Supabase

💡 **Supabase** é uma plataforma de back-end pronta (o termo técnico é "Backend as a Service", ou BaaS). Por baixo, é um banco **PostgreSQL** completo, com várias ferramentas em volta:

| Recurso | O que é | Usamos neste vídeo? |
|---|---|---|
| **Database** | Um PostgreSQL de verdade, o mesmo banco usado por grandes empresas | ✅ Sim (3 tabelas, trigger, índice) |
| **API automática** | Cada tabela criada vira automaticamente uma API REST. Você não escreve back-end pra CRUD. | ✅ Sim (via `supabase-js`) |
| **Row Level Security (RLS)** | Regras dentro do banco que dizem quem pode ler/escrever cada linha | ✅ Sim |
| **Auth** | Login com e-mail, Google, GitHub etc. Cria a tabela `auth.users` | ✅ Sim (e-mail e senha) |
| **Storage** | Upload de arquivos (imagens, PDFs) | ❌ |
| **Realtime** | Receber mudanças do banco ao vivo | ❌ |
| **Edge Functions** | Código de servidor sob demanda | ❌ |

_"O pulo do gato do Supabase é esse: você cria uma tabela e **já tem uma API pronta** pra ela. O nosso front-end vai conversar direto com o Supabase, sem a gente precisar escrever um servidor Node no meio."_

**Por que Supabase e não outro?**
- É **Postgres puro**: se um dia você sair do Supabase, leva o banco junto (não fica preso a um formato proprietário, como acontece com o Firebase).
- Tem **plano gratuito** bom pra começar e validar ideias.
- SQL é um conhecimento que vale pra vida toda, não só pra essa ferramenta.

**Quando usar Supabase:**
- MVPs, SaaS, painéis administrativos, apps mobile, projetos pessoais e de clientes.
- Quando você quer banco relacional + login + storage sem montar infraestrutura.

**Quando talvez NÃO usar:**
- Quando a empresa exige que tudo rode na infraestrutura própria (dá pra fazer self-host do Supabase, mas aí você volta a cuidar de servidor).
- Quando o processamento é pesado e contínuo no back-end (filas, jobs longos): aí você complementa com outro serviço.

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

_"Repare: o Next.js entrega a página, e **o próprio navegador** conversa com o Supabase. Por isso a segurança não pode depender de esconder a chave. Ela depende do **login** + das regras de RLS dentro do banco. Vamos ver isso na prática."_

### 1.4 Conceitos que vão aparecer no vídeo

💡 Explicar rapidamente, um por um:

- **Variáveis de ambiente:** configurações (URLs, chaves) que ficam **fora do código**. Assim o mesmo código roda em lugares diferentes com valores diferentes, e segredos não vão parar no GitHub.
- **`NEXT_PUBLIC_`:** prefixo do Next.js que diz "essa variável pode ir para o navegador". Sem o prefixo, ela só existe no servidor.
- **publishable key** (antiga *anon key*): chave **pública** do Supabase. Ela identifica o projeto, mas só permite o que as políticas de RLS liberarem.
- **secret key** (antiga *service_role key*): chave **secreta** que **ignora o RLS**. ⚠️ Nunca no front-end, nunca com `NEXT_PUBLIC_`, nunca no GitHub.
- **RLS (Row Level Security):** "porteiro" dentro do banco. Com RLS ligado e nenhuma política, ninguém acessa nada. Cada política libera uma ação específica.

---

## Parte 2: Preparação do projeto e GitHub (4 min)

### 2.1 Tour pelo projeto

🎬 Abrir o projeto no editor e mostrar arquivo por arquivo:

| Arquivo | Pra que serve |
|---|---|
| `package.json` | Lista as dependências: `next`, `react`, `react-dom` e `@supabase/supabase-js` (a biblioteca oficial que conversa com a API do Supabase) |
| `app/layout.js` | Estrutura HTML base de todas as páginas (App Router do Next.js) |
| `app/page.js` | A página principal: tela de login/cadastro e, depois de entrar, projetos e tarefas do usuário (criar, concluir, apagar). Só cuida da tela; as requisições ficam em `services/` |
| `app/globals.css` | Estilos |
| `services/` | Todas as requisições ao Supabase, um arquivo por tabela (`tarefas.js`, `projetos.js`, `perfis.js`) + `auth.js` pro login. Cada um tem as funções de CRUD: `listar`, `criar`, `atualizar`, `deletar`. A tela só chama `tarefasService.listar()`. |
| `utils/supabase.js` | Cria **um único cliente** do Supabase lendo as variáveis de ambiente. Centralizar aqui evita repetir configuração. |
| `supabase-setup.sql` | Script que cria as 3 tabelas, o trigger, o índice e as regras de segurança (atalho da Parte 3) |
| `.env.example` | **Modelo** das variáveis necessárias. Vai pro GitHub pra documentar o que o projeto precisa. |
| `.env.local` | Os **valores reais** das variáveis. **Não** vai pro GitHub. |
| `.gitignore` | Lista do que o Git deve ignorar |

🎬 Abrir `utils/supabase.js`:

_"Aqui a gente lê a URL e a chave das variáveis de ambiente e cria o cliente. O resto do app só importa o `api` daqui."_

🎬 Abrir `.gitignore` e destacar `.env*.local`:

_"Essa linha é o que impede suas chaves de irem pro GitHub. Repositório público com chave vazada é um dos erros mais comuns, e existem robôs varrendo o GitHub atrás disso o tempo todo."_

### 2.2 Rodar localmente

🎬 No terminal:

```bash
npm install     # baixa as dependências listadas no package.json
npm run dev     # sobe o servidor de desenvolvimento
```

> Ainda não abra o navegador: sem o `.env.local` preenchido o app dá erro (`supabaseUrl is required`). A gente preenche na 3.11.

### 2.3 Subir para o GitHub

💡 _"Por que GitHub? Guarda o histórico do código e é de lá que o deploy (próximo vídeo) vai puxar."_

🎬 Criar repositório: github.com → **New repository** → nome `demo-supabase` → **sem** README, .gitignore ou licença (já temos os arquivos) → **Create**.

> Público ou privado? Pra projeto real de cliente, use **privado**.

🎬 No terminal:

```bash
git init
git add .
git status        # 👀 conferir: .env.local NÃO pode aparecer na lista
git commit -m "Projeto inicial"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/demo-supabase.git
git push -u origin main
```

🎬 Atualizar a página do repositório e mostrar que **o `.env.example` está lá e o `.env.local` não**.

---

## Parte 3: Banco, Auth e chaves no Supabase (20 min)

> Nesta parte criamos tudo **na mão pelo painel**, pra você ver cada peça. No fim (3.9) tem o atalho: o `supabase-setup.sql` faz o mesmo de uma vez.

### 3.1 Criar o projeto

🎬 https://supabase.com → **Start your project** → login com GitHub → **New project**.

Preencher:
- **Name:** `demo-tarefas`
- **Database Password:** gerar uma senha forte e **guardar num gerenciador de senhas**.
  - _"Essa senha dá acesso direto ao Postgres. O app não vai usar, mas você vai precisar dela pra conectar ferramentas como DBeaver, fazer migrações ou backups."_
- **Region:** a mais próxima dos **seus usuários** (ex.: _South America (São Paulo)_ para público brasileiro).
  - 💡 _"Cada requisição viaja até o banco. Banco nos EUA com usuário no Brasil significa mais latência em todo clique. Não dá pra trocar a região depois sem migrar o projeto."_
- **Plan:** Free.

_"O projeto leva uns minutos pra ficar pronto. Enquanto isso, vamos entender o modelo de dados."_

### 3.2 As chaves: duas coisas diferentes com o mesmo nome

💡 _"Vai aparecer a palavra **chave** o tempo todo, e ela significa duas coisas que não têm nada a ver uma com a outra:"_

| | Chaves do **banco** (PK / FK) | Chaves da **API** (publishable / secret) |
|---|---|---|
| O que são | Colunas que identificam e ligam linhas | Tokens que identificam seu projeto nas requisições |
| Pra que servem | Organizar e relacionar dados | Autorizar quem chama a API |
| Onde ficam | Dentro das tabelas | Em **Project Settings → API** e nas variáveis de ambiente |
| Vemos em | 3.3 a 3.5 | 3.10 |

**Chaves do banco:**

- **PK (Primary Key, chave primária):** a identidade da linha. Única e nunca vazia. _"É o CPF da linha: duas tarefas podem ter o mesmo título, mas nunca o mesmo `id`."_
- **FK (Foreign Key, chave estrangeira):** uma coluna que **aponta para a PK de outra tabela**. O banco garante que o valor existe lá. _"Não dá pra criar uma tarefa com `user_id` de um usuário que não existe: o Postgres recusa."_
- **`on delete cascade`:** se a linha "pai" for apagada, as "filhas" vão junto. Apagou o usuário → somem perfil, projetos e tarefas dele.
- **`on delete set null`:** se o pai some, a filha fica, só perde a referência. Apagou o projeto → a tarefa continua, agora "sem projeto".

### 3.3 O modelo: 3 tabelas ligadas ao Auth

💡 _"O Supabase já vem com uma tabela de usuários pronta: `auth.users`, no schema `auth`. Toda vez que alguém se cadastra, cai uma linha ali. A gente **não mexe** nela: cria as nossas tabelas no schema `public` e **aponta** pra ela com FK."_

🎬 Mostrar este diagrama na tela:

```
                    ┌────────────────────┐
                    │     auth.users     │   (gerenciada pelo Supabase Auth)
                    │  id uuid  PK       │
                    └─────────┬──────────┘
          ┌───────────────────┼─────────────────────┐
          │ 1:1               │ 1:N                 │ 1:N
          ▼                   ▼                     ▼
┌──────────────────┐ ┌──────────────────┐ ┌───────────────────────┐
│  public.perfis   │ │ public.projetos  │ │    public.tarefas     │
│ id uuid PK + FK  │ │ id bigint PK     │ │ id bigint PK          │
│ nome             │ │ user_id uuid FK  │ │ user_id uuid FK       │
│ created_at       │ │ nome             │◀┤ projeto_id bigint FK  │ N:1 (opcional)
└──────────────────┘ │ created_at       │ │ titulo, concluida     │
                     └──────────────────┘ │ created_at            │
                                          └───────────────────────┘
```

| Tabela | Relação com `auth.users` | Detalhe que vale explicar |
|---|---|---|
| `perfis` | **1:1**: um usuário, um perfil | A PK **é também** a FK: o `id` do perfil é o próprio `id` do usuário. Criada automaticamente por um **trigger** (3.6). |
| `projetos` | **1:N**: um usuário, vários projetos | `user_id` com default `auth.uid()`: o banco preenche com quem está logado. |
| `tarefas` | **1:N** com usuário **e** N:1 com projeto | Duas FKs na mesma tabela. `projeto_id` pode ser vazio (tarefa avulsa). |

_"Por que não guardar o nome direto em `auth.users`? Porque ela é do Supabase, fica num schema protegido e não é exposta pela API. Dados do seu app ficam nas suas tabelas."_

### 3.4 Configurar o Auth (login por e-mail e senha)

🎬 Menu **Authentication → Sign In / Providers** → **Email**: deixar **habilitado**.

🎬 Para a demo, **desligar "Confirm email"** → Save.

_"Com a confirmação ligada, o usuário só entra depois de clicar no link do e-mail. O servidor de e-mail embutido do plano grátis tem limite baixo de envios por hora, então na gravação a gente desliga."_ ⚠️ _"Em produção, **religue** e configure um SMTP próprio (Parte 4)."_

> O app trata os dois casos: com confirmação ligada, mostra "Confirme pelo link enviado ao seu e-mail".

### 3.5 Criar as tabelas manualmente (Table Editor)

🎬 Menu **Table Editor** → **New table**. Em todas as tabelas: deixar marcado **Enable Row Level Security (RLS)**.

_"O painel já sugere duas colunas: `id` (número automático, PK) e `created_at` (data de criação). Vamos aproveitar."_

> Os nomes dos botões mudam um pouco entre versões do painel. A lógica é sempre: coluna → tipo → default → FK.

**Tabela 1: `perfis`** (a 1:1, a mais diferente)

| Coluna | Tipo | Default | Configuração |
|---|---|---|---|
| `id` | **`uuid`** (trocar de `int8`) | _vazio_ (remover identity) | Primary ✅ |
| `nome` | `text` | | Is Nullable ❌ |
| `created_at` | `timestamptz` | `now()` | (já vem) |

🎬 Na coluna `id`, clicar no ícone de link (**Add foreign key relation**) → **Schema:** `auth` → **Table:** `users` → **Column:** `id` → **On delete:** `Cascade` → Save.

_"Aqui está o 1:1: a PK do perfil é FK pro usuário. Não existe perfil sem usuário, e não existem dois perfis pro mesmo usuário."_

**Tabela 2: `projetos`**

| Coluna | Tipo | Default | Configuração |
|---|---|---|---|
| `id` | `int8` | identity | Primary ✅ (já vem) |
| `user_id` | `uuid` | **`auth.uid()`** | Is Nullable ❌ · FK → `auth.users.id` · On delete `Cascade` |
| `nome` | `text` | | Is Nullable ❌ · CHECK: `char_length(nome) <= 60` |
| `created_at` | `timestamptz` | `now()` | (já vem) |

💡 _"`auth.uid()` é uma função do Supabase que devolve o id de quem está logado na requisição. Como default, o front-end nem precisa mandar o `user_id`: o banco preenche sozinho."_

**Tabela 3: `tarefas`**

| Coluna | Tipo | Default | Configuração |
|---|---|---|---|
| `id` | `int8` | identity | Primary ✅ (já vem) |
| `user_id` | `uuid` | `auth.uid()` | Is Nullable ❌ · FK → `auth.users.id` · On delete `Cascade` |
| `projeto_id` | `int8` | | Is Nullable ✅ · FK → `public.projetos.id` · On delete `Set null` |
| `titulo` | `text` | | Is Nullable ❌ · CHECK: `char_length(titulo) <= 200` |
| `concluida` | `bool` | `false` | Is Nullable ❌ |
| `created_at` | `timestamptz` | `now()` | (já vem) |

🎬 Depois de salvar as três, mostrar **Database → Schema Visualizer**: o painel desenha as setas das FKs, igual ao nosso diagrama.

_"Validação no banco (`not null`, `check`) é a última linha de defesa: vale mesmo se alguém chamar a API sem passar pelo nosso formulário."_

### 3.6 Trigger: perfil criado automaticamente no cadastro

💡 **Trigger** é um "gatilho": código que o banco roda sozinho quando algo acontece numa tabela (insert, update, delete). _"Quando alguém se cadastra, o Supabase insere uma linha em `auth.users`. A gente pendura um trigger nesse insert pra criar o perfil. Assim o front-end não precisa lembrar de fazer isso, e nunca existe usuário sem perfil."_

São duas peças: uma **função** (o que fazer) e um **trigger** (quando fazer). Dá pra criar pelo painel (caminho A) ou colar o SQL (caminho B). O resultado é o mesmo.

#### Caminho A: pelo painel (sem SQL Editor)

> Os nomes dos campos mudam um pouco entre versões do painel. A lógica é sempre: função primeiro, trigger depois.

**Passo 1: a função.** 🎬 **Database → Functions** → **Create a new function**:

| Campo | Valor | Significado |
|---|---|---|
| **Name of function** | `criar_perfil` | Nome que o trigger vai chamar |
| **Schema** | `public` | Onde a função mora |
| **Return type** | `trigger` | Função feita pra ser chamada por trigger |
| **Arguments** | _vazio_ | Função de trigger não recebe argumentos: os dados chegam em `new` |
| **Definition** | o bloco abaixo | Só o corpo, **sem** o `create function` e sem os `$$` |
| **Language** (Show advanced settings) | `plpgsql` | Linguagem com `begin ... end` |
| **Type of security** | **`SECURITY DEFINER`** | Roda com a permissão do dono, ignorando o RLS |
| **Configuration parameters** | `search_path` = _vazio_ (`''`) | Obriga a escrever `public.perfis` |

Definition:

```sql
begin
  insert into public.perfis (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)));
  return new;
end;
```

→ **Confirm**.

**Passo 2: o trigger.** 🎬 **Database → Triggers** → **Create a new trigger**:

| Campo | Valor | Significado |
|---|---|---|
| **Name of trigger** | `ao_criar_usuario` | Só um nome |
| **Table** | `auth.users` | Tabela observada (pode ser preciso trocar o schema para `auth`) |
| **Events** | ✅ `Insert` | Dispara quando entra uma linha nova (um cadastro) |
| **Trigger type** | `After the event` | Roda **depois** do insert: o usuário já existe, então o `id` é válido pra FK |
| **Orientation** | `Row` | Uma vez por linha inserida (`for each row`) |
| **Function to trigger** | `criar_perfil` | A função do passo 1 |

→ **Confirm**.

> ⚠️ O schema `auth` é gerenciado pelo Supabase, e algumas versões do painel não deixam escolher `auth.users` nesse formulário. Se a tabela não aparecer, crie só a função pelo painel e rode no **SQL Editor** apenas o trecho `create trigger ...` do caminho B.

#### Caminho B: SQL Editor

🎬 **SQL Editor** → **New query** → colar → **Run**:

```sql
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
```

Explicar linha a linha:
- `returns trigger`: é uma função feita pra ser chamada por trigger.
- `new`: a linha que acabou de ser inserida em `auth.users`.
- `raw_user_meta_data ->> 'nome'`: o nome que o app manda no cadastro (`signUp({ options: { data: { nome } } })`). Se não vier, usa a parte do e-mail antes do `@`.
- `security definer`: a função roda com a permissão de quem a criou, **ignorando o RLS**. Precisa, porque no momento do cadastro ninguém está logado ainda.
- `set search_path = ''`: obriga a escrever `public.perfis` com o schema. ⚠️ Boa prática de segurança em toda função `security definer`.
- `after insert ... for each row`: roda depois de cada cadastro.

🎬 Mostrar em **Database → Triggers** (trocar o schema para `auth`) o `ao_criar_usuario` listado.

> ⚠️ Se essa função der erro, o **cadastro inteiro falha** ("Database error saving new user"). Trigger em `auth.users` tem que ser simples e à prova de falha.

### 3.7 Índice (exemplo didático)

💡 **Índice** é como o índice remissivo de um livro: em vez de ler todas as páginas atrás de um assunto, você vai direto na página certa. Sem índice, o Postgres lê a tabela inteira a cada consulta.

_"Com meia dúzia de tarefas, não faz diferença nenhuma. Estou criando **só pra mostrar como e por quê**. Com milhares de usuários, faz toda a diferença."_

🎬 **Database → Indexes** → **Create index** → schema `public` → tabela `tarefas` → colunas `user_id` e `created_at` → Create. Equivalente em SQL:

```sql
create index tarefas_user_id_created_at_idx on public.tarefas (user_id, created_at);
```

_"Por que essas duas colunas e nessa ordem? Porque é exatamente a consulta do app: o RLS filtra por `user_id` e a gente ordena por `created_at`. O índice entrega as tarefas do usuário já em ordem."_

> Regra prática: índice nas colunas que aparecem em filtros (`where`, políticas de RLS) e nas FKs de tabelas grandes. Cada índice também deixa o insert um pouco mais lento, então não saia criando em tudo. O **Performance Advisor** do Supabase sugere os que faltam.

### 3.8 Políticas de RLS: cada um vê só o que é seu

_"O RLS está ligado nas três tabelas, mas sem nenhuma política: ninguém acessa nada. Agora liberamos: **cada usuário logado só lê e altera as próprias linhas**."_

São 4 políticas. Dá pra criar pelo painel (caminho A) ou colar o SQL (caminho B). O resultado é o mesmo.

#### Caminho A: pelo painel (sem SQL Editor)

> Os nomes dos campos mudam um pouco entre versões do painel. O painel monta o SQL na hora: dá pra mostrar isso no vídeo.

🎬 **Authentication → Policies**. Cada tabela aparece num card com o status do RLS. No card da tabela → **Create policy** → escolher **"Create a policy from scratch"** (ou um template e ajustar).

**Campos do formulário:**

| Campo | Significado |
|---|---|
| **Policy Name** | Só um nome pra você reconhecer. Não muda nada no comportamento. |
| **Table** | Tabela protegida (já vem preenchida pelo card). |
| **Policy Behavior** | `permissive` (padrão): políticas do mesmo comando se somam com **OU**. `restrictive`: vira um **E** obrigatório que corta mesmo se outra liberar. Usar sempre `permissive` aqui. |
| **Policy Command** | `SELECT`, `INSERT`, `UPDATE`, `DELETE` ou `ALL`. |
| **Target Roles** | Quem a política atinge: `authenticated` (logado), `anon` (visitante). Vazio = `public` (todos). |
| **USING** | Filtra as linhas **que já existem**: quais a pessoa vê, edita ou apaga. |
| **WITH CHECK** | Valida a linha **nova ou alterada**: o que a pessoa pode gravar. |

💡 O painel só mostra as caixas que fazem sentido pro comando escolhido:

| Comando | USING | WITH CHECK |
|---|---|---|
| SELECT | ✅ | ❌ |
| INSERT | ❌ | ✅ |
| UPDATE | ✅ (qual linha pode mexer) | ✅ (como ela pode ficar) |
| DELETE | ✅ | ❌ |
| ALL | ✅ | ✅ |

**As 4 políticas:**

**1. Tabela `perfis`**

| Campo | Valor |
|---|---|
| Policy Name | `Dono lê perfil` |
| Command | `SELECT` |
| Target Roles | `authenticated` |
| USING | `(select auth.uid()) = id` |

**2. Tabela `perfis`**

| Campo | Valor |
|---|---|
| Policy Name | `Dono edita perfil` |
| Command | `UPDATE` |
| Target Roles | `authenticated` |
| USING | `(select auth.uid()) = id` |
| WITH CHECK | `(select auth.uid()) = id` |

**3. Tabela `projetos`**

| Campo | Valor |
|---|---|
| Policy Name | `Dono gerencia projetos` |
| Command | `ALL` |
| Target Roles | `authenticated` |
| USING | `(select auth.uid()) = user_id` |
| WITH CHECK | `(select auth.uid()) = user_id` |

**4. Tabela `tarefas`**

| Campo | Valor |
|---|---|
| Policy Name | `Dono gerencia tarefas` |
| Command | `ALL` |
| Target Roles | `authenticated` |
| USING | `(select auth.uid()) = user_id` |
| WITH CHECK | o bloco abaixo |

```sql
(select auth.uid()) = user_id
and (
  projeto_id is null
  or exists (select 1 from public.projetos p where p.id = projeto_id and p.user_id = (select auth.uid()))
)
```

→ **Review** (mostra o SQL gerado) → **Save policy**.

> ⚠️ Nas caixas USING e WITH CHECK vai **só a expressão**, sem `using (` e sem `)` em volta.

🎬 No fim, cada card mostra as políticas listadas. _"Repara que perfil não tem política de INSERT nem DELETE: ninguém consegue criar ou apagar perfil pela API. Só o trigger cria."_

#### Caminho B: SQL Editor

🎬 **SQL Editor** → colar → **Run**:

```sql
create policy "Dono lê perfil" on public.perfis
  for select to authenticated using ((select auth.uid()) = id);

create policy "Dono edita perfil" on public.perfis
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Dono gerencia projetos" on public.projetos
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

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
```

- `to authenticated`: só vale pra quem está logado. Visitante anônimo não vê nada.
- `using`: filtra **quais linhas** a pessoa enxerga ou pode alterar.
- `with check`: valida **o dado novo** que está sendo gravado.
- `for all`: vale para select, insert, update e delete.
- `(select auth.uid())`: igual a `auth.uid()`, mas o Postgres calcula uma vez por consulta em vez de uma vez por linha. Recomendação oficial do Supabase.
- O `exists` na política de tarefas: _"sem ele, eu poderia criar uma tarefa minha apontando pro `projeto_id` de outra pessoa. A FK só garante que o projeto **existe**, não que é **meu**. Quem garante isso é o RLS."_
- Perfil não tem política de insert: quem cria é o trigger (que ignora RLS).

### 3.9 Atalho: tudo de uma vez com o script

🎬 Abrir o `supabase-setup.sql` no editor: _"Esse arquivo tem exatamente o que fizemos de 3.5 a 3.8, mais o bônus de admin da 3.13. Num projeto novo, colar ele inteiro no SQL Editor e rodar dá o mesmo resultado. Fiz na mão pra você entender cada peça; no dia a dia, SQL versionado no Git é melhor, porque dá pra repetir em outro projeto (dev, prod) sem esquecer nada."_

> Rodar o script **depois** de ter criado tudo na mão dá erro de "already exists". É um caminho **ou** outro.

### 3.10 Pegar as chaves da API

🎬 Botão **Connect** no topo do painel (ou **Project Settings → API Keys**). A tela mostra três coisas:

| No painel | Formato | O que é | Usamos? |
|---|---|---|---|
| **Publishable key** | `sb_publishable_...` | Chave pública do projeto. Vai no front-end. | ✅ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| **Secret key** | `sb_secret_...` | Chave mestra, **ignora o RLS**. Só em servidor. | ❌ Não neste app |
| **JWKS URL** | `https://xxxx.supabase.co/auth/v1/.well-known/jwks.json` | Endereço das chaves públicas que conferem a assinatura dos tokens de login (JWT). Serve pra um back-end **seu** validar tokens sem perguntar ao Supabase. | ❌ Não neste app |

E a **Project URL** (`https://xxxx.supabase.co`, em **Connect** ou **Project Settings → Data API**) → `NEXT_PUBLIC_SUPABASE_URL`.

| Chave | Quem usa | Respeita RLS? | Pode ir pro navegador? |
|---|---|---|---|
| **publishable** | Front-end (nosso app) | ✅ Sim | ✅ Sim, é pública por design |
| **secret** | Só código de servidor (scripts, jobs, webhooks) | ❌ **Ignora tudo** | ❌ **Nunca** |

_"A publishable key sozinha não dá acesso a nada: ela só identifica o projeto. Quem decide o que cada um vê é o RLS + o login. Depois do login, o `supabase-js` manda junto o token do usuário (um JWT), e é dele que o `auth.uid()` tira o id."_

_"A **secret** é a chave mestra do prédio: ignora todas as políticas. Só em código de servidor, **jamais** com `NEXT_PUBLIC_`, jamais no GitHub. Se vazar, gere outra na hora."_

> Tutoriais antigos falam em "anon key" e "service_role key". São as versões antigas (ficam em **API Keys → Legacy API keys**, formato `eyJhbGci...`). A publishable substitui a anon, a secret substitui a service_role. No banco, quem usa a publishable continua caindo no papel `anon` (sem login) ou `authenticated` (com login), por isso as políticas usam esses nomes.

### 3.11 Conectar o app local

🎬 Abrir `.env.local` e colar:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

> Sem aspas e sem espaços antes ou depois do `=`.

🎬 No terminal: **Ctrl+C** e `npm run dev` de novo.

_"O Next.js lê as variáveis de ambiente só quando inicia. Mudou o `.env.local`, tem que reiniciar."_

🎬 Abrir http://localhost:3000 → tela de login.

### 3.12 Provar tudo funcionando

🎬 Deixar o app e o painel do Supabase lado a lado:

1. **Criar conta** com nome "Ana" → entra direto e mostra "Olá, Ana".
   - 🎬 **Authentication → Users** tem a Ana. Table Editor → `perfis` tem uma linha com o **mesmo id**. _"Ninguém inseriu isso pelo app: foi o trigger."_
2. Criar o projeto "Trabalho" → linha em `projetos` com o `user_id` da Ana preenchido sozinho (default `auth.uid()`).
3. Criar a tarefa "Gravar vídeo" no projeto "Trabalho" → aparece com a etiqueta do projeto.
   - 💡 _"No código, a consulta é `select('*, projetos(nome)')`. O Supabase seguiu a FK `projeto_id` e trouxe o nome do projeto junto. Isso é um join, sem escrever SQL."_
4. **Sair** → criar outra conta "Bruno" → lista **vazia**.
   - _"Mesma tabela, mesma publishable key, mas o Bruno não vê nada da Ana. Isso é o RLS com `auth.uid()`. Repare que o código **não tem nenhum filtro por usuário**: quem filtra é o banco."_
5. (Opcional) Em **Authentication → Users**, apagar o Bruno → perfil, projetos e tarefas dele somem. _"`on delete cascade` na prática."_

### 3.13 Bônus: roles do Postgres × papel de admin (5 min)

💡 _"Duas coisas diferentes com o nome parecido:"_

| | Roles do Postgres | Papéis do app |
|---|---|---|
| Exemplos | `anon`, `authenticated`, `service_role` | `usuario`, `admin` |
| Quem cria | O Supabase (já vêm prontas) | Você (coluna + políticas) |
| De onde vem | Campo `role` do JWT | Coluna `papel` em `perfis` |
| Pergunta que responde | "Que **tipo** de chamador é?" | "O que essa pessoa pode fazer **no meu negócio**?" |

**Roles do Postgres.** 🎬 Colar um JWT do app (F12 → Application → Local Storage) em jwt.io e mostrar o campo `"role": "authenticated"`.

- `anon`: visitante sem login (só a publishable key). RLS vale.
- `authenticated`: usuário logado (JWT do login). RLS vale.
- `service_role`: papel de quem usa a secret key. **Ignora o RLS.** Só no servidor.

_"A cada requisição o Supabase lê o `role` do JWT e roda a consulta como aquela role do Postgres. É por isso que nossas políticas têm `to authenticated`: visitante não logado não tem política nenhuma, então não vê nada."_

**Papel de admin.** _"O Supabase não sabe o que é 'admin' no seu negócio: pra ele, todo logado é só `authenticated`. Vamos criar: o admin **enxerga** as tarefas de todo mundo, mas só **mexe** nas próprias."_

🎬 **SQL Editor** → colar → **Run**:

```sql
-- 1. Papel de cada usuário. Todo mundo nasce 'usuario'.
alter table public.perfis add column papel text not null default 'usuario'
  check (papel in ('usuario', 'admin'));

-- 2. O usuário só pode editar o próprio nome, nunca o papel.
revoke update on public.perfis from anon, authenticated;
grant update (nome) on public.perfis to authenticated;

-- 3. Função: quem está logado é admin?
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

-- 4. Admin lê tudo (só leitura)
create policy "Admin lê tarefas" on public.tarefas
  for select to authenticated using ((select public.eh_admin()));

create policy "Admin lê projetos" on public.projetos
  for select to authenticated using ((select public.eh_admin()));
```

Explicar:
- **Passo 2 é o mais importante.** ⚠️ _"A política 'Dono edita perfil' deixa o usuário editar a própria linha. Sem o `revoke`, qualquer um abriria o console do navegador e rodaria `update({ papel: 'admin' })` no próprio perfil. Com o `grant update (nome)`, o Postgres só aceita update na coluna `nome`."_
- **Por que uma função?** A política precisa consultar `perfis`, que também tem RLS. A função `security definer` lê direto, sem cair nas regras de novo. `stable` + `(select ...)` fazem o Postgres calcular uma vez por consulta, não uma vez por linha.
- **Políticas se somam (OU):** pra ler uma tarefa basta passar em **uma** política. O usuário comum passa em "Dono gerencia tarefas" só nas dele; o admin passa em "Admin lê tarefas" em todas.
- **Por que projetos também?** Pro join `projetos(nome)` funcionar nas tarefas dos outros. Sem isso, o admin veria a tarefa mas a etiqueta do projeto viria vazia, porque o RLS de `projetos` esconderia o projeto.
- **Admin não edita nem apaga dados dos outros:** só ganhou política de `select`. No app, a caixinha e o ✕ ficam desativados nas tarefas de outro usuário.

🎬 **Testar:**
1. Logado como Ana → vê só as tarefas dela.
2. **Table Editor → `perfis`** → linha da Ana → `papel` = `admin` → Save. _"Quem promove admin é você, pelo painel, que ignora o RLS. Pelo app ninguém consegue."_
3. **F5** no app → aparece a etiqueta **admin** ao lado do nome e as tarefas do Bruno com a etiqueta **outro usuário** (precisa do Bruno ainda existir; pule o passo 5 de 3.12 ou crie outra conta).
4. Tentar marcar a tarefa do Bruno → caixinha desativada.
5. **Prova de segurança:** no **SQL Editor**, trocar o seletor de role (embaixo, ao lado do Run, vem `postgres`) para **authenticated** e escolher o usuário **Bruno**. Rodar:
   ```sql
   update public.perfis set papel = 'admin' where id = auth.uid();
   ```
   → `permission denied for table perfis`. _"Mesmo logado e mesmo sendo dono da linha, o Bruno não consegue se promover. A trava está no banco, não no front."_
   - Voltar o seletor para `postgres` depois.

> Alternativa avançada: colocar o papel **dentro do JWT** com um *Custom Access Token Hook* (Authentication → Hooks). Evita consultar `perfis` a cada requisição, mas o papel só atualiza quando o token renova (até 1 hora). Só compensa com muito volume.

---

## Parte 4: Antes de colocar SEU app em produção (6 min)

> _"Tudo o que fizemos até aqui funciona, mas foi pensado pra demo. Se você vai colocar um projeto real no ar, com usuários e dados de verdade, preste atenção nesta parte."_

### 4.1 Segurança: o que a demo já faz e o que falta ⚠️

_"A boa notícia: a parte mais importante já está feita. Login com Supabase Auth, dono em cada linha (`user_id` com FK pra `auth.users`) e RLS por usuário. O que falta pra um app real:"_

- **Religar "Confirm email"** (Authentication → Sign In / Providers → Email) e configurar um **SMTP próprio** (Authentication → Emails → SMTP Settings, com Resend, SendGrid, Amazon SES etc.). O servidor embutido do plano grátis é só pra testes e tem limite baixo de envios.
- **Recuperação de senha** (`supabase.auth.resetPasswordForEmail`) e, se fizer sentido, login social (Google, GitHub).
- **Revisar cada política** ao criar tabela nova: o padrão é copiar o `(select auth.uid()) = user_id`.
- **Índices nas FKs** quando as tabelas crescerem (`projetos.user_id`, `tarefas.projeto_id`). O Performance Advisor avisa.

**Outras regras de segurança:**
- **Toda tabela no schema `public` com RLS ligado.** O Supabase mostra alertas no **Security Advisor** (menu Advisors). Revise antes de lançar.
- **Secret key só no servidor**, sem `NEXT_PUBLIC_`. Se vazar: gere outra imediatamente em Project Settings → API Keys.
- **Validação no banco** (`not null`, `check`, tamanho máximo) além da validação no formulário. A demo já faz isso em `titulo` e `nome`.
- **Funções `security definer`** (como a do trigger) sempre com `set search_path = ''` e nunca no schema `public` expostas sem necessidade. O Security Advisor aponta as problemáticas.

### 4.2 Ambientes separados

| | Desenvolvimento | Produção |
|---|---|---|
| Projeto Supabase | `meuapp-dev` | `meuapp-prod` |
| Variáveis | `.env.local` aponta pro dev | hospedagem aponta pro prod |

_"Assim um teste local nunca apaga dados de cliente. Para levar mudanças de banco do dev para o prod de forma controlada, use **migrações** com a Supabase CLI (`supabase migration new`, `supabase db push`) em vez de colar SQL na mão em produção."_

### 4.3 Planos, limites e custos

⚠️ Confira sempre as páginas de preços atualizadas. Pontos que costumam pegar quem está começando:

- **Supabase Free:** projetos **pausam após um período sem atividade** (hoje, cerca de 1 semana), e o plano tem limites de tamanho de banco, armazenamento e tráfego. **Não tem backup automático com restauração self-service**. Pra produção com clientes, avalie o plano **Pro**.
- Ative **alertas de uso/gasto** no Supabase pra não ser surpreendido.

### 4.4 Monitoramento e backups

- **Supabase:** **Logs Explorer** (requisições à API e erros do banco), **Reports** (uso) e **Database → Backups** (nos planos pagos).
- Mesmo no plano gratuito, faça um backup manual periódico: `supabase db dump` (CLI) ou `pg_dump` usando a connection string do painel.

### 4.5 Checklist final antes do lançamento

- [ ] RLS ligado em **todas** as tabelas, sem políticas `using (true)` em dados sensíveis
- [ ] Security Advisor do Supabase sem alertas críticos
- [ ] Nenhuma chave secreta no código, no GitHub ou com prefixo `NEXT_PUBLIC_`
- [ ] Projetos Supabase separados pra dev e prod
- [ ] Plano adequado ao uso (comercial = planos pagos)
- [ ] "Confirm email" religado + SMTP próprio
- [ ] Estratégia de backup definida
- [ ] Alertas de gasto ativados

---

## Parte 5: Encerramento (1 min)

_"Recapitulando:"_

1. _"**Supabase** nos deu login, um banco Postgres com 3 tabelas ligadas ao usuário por **chaves estrangeiras**, um **trigger** que cria o perfil no cadastro, um **índice** e segurança por RLS, sem escrever back-end."_
2. _"O app conversa direto com o Supabase pelo `supabase-js`, e quem protege os dados é o login + RLS, não esconder a chave."_
3. _"Pra produção de verdade: confirmação de e-mail com SMTP próprio, ambientes separados e o plano certo."_

_"O código deste projeto está no link da descrição. No próximo vídeo, a gente publica esse app na Vercel. Até lá!"_

---

## Anexo: problemas comuns e soluções

| Sintoma | Causa provável | Solução |
|---|---|---|
| `supabaseUrl is required` | `.env.local` vazio ou servidor não reiniciado | Preencher e reiniciar `npm run dev` |
| `relation "public.tarefas" does not exist` | Tabelas não criadas ou criadas em outro projeto | Refazer 3.5 ou rodar `supabase-setup.sql` no projeto certo |
| `new row violates row-level security policy` | Falta política, usuário não logado ou `projeto_id` de outra pessoa | Conferir 3.8 e se o usuário está logado |
| Lista vazia sem erro, mas há dados no Table Editor | Dados de **outro usuário** (RLS correto!) ou falta política de SELECT | Entrar com o dono das linhas; conferir 3.8 |
| `Database error saving new user` no cadastro | Erro dentro do trigger `criar_perfil` (tabela `perfis` com coluna diferente, falta `public.` no nome) | Testar a função; conferir 3.5 e 3.6 |
| "Olá, e-mail" em vez do nome | Usuário criado antes do trigger existir (sem perfil) | Inserir o perfil na mão ou criar a conta de novo |
| Cadastro diz "Confirme pelo link" e não chega e-mail | "Confirm email" ligado + limite do e-mail grátis | Desligar para a demo (3.4) ou configurar SMTP próprio |
| `Email rate limit exceeded` | Muitos cadastros/e-mails em pouco tempo no plano grátis | Esperar, desligar confirmação ou usar SMTP próprio |
| Admin não vê tarefas dos outros | `papel` alterado mas página não recarregada, ou falta a política "Admin lê tarefas" | F5; conferir 3.13 |
| `permission denied for table perfis` ao editar o nome | Faltou o `grant update (nome)` depois do `revoke` | Rodar o passo 2 da 3.13 completo |
| `foreign key constraint ... perfis_id_fkey` ao inserir perfil na mão | O `id` não existe em `auth.users` | Usar o id copiado de Authentication → Users |
| `Invalid API key` | Chave copiada errada (espaço, quebra de linha, chave truncada) | Copiar de novo a publishable key |
| `... already exists` ao rodar o script | Tabelas criadas na mão (3.5) ou script já executado | É um caminho **ou** outro; em projeto limpo, rode só o script |
| App parou de funcionar depois de dias parado | Projeto Supabase Free pausado por inatividade | Painel do Supabase → **Restore project** |
| `.env.local` apareceu no `git status` | `.gitignore` ausente ou alterado | Conferir `.gitignore`; se já commitou, **gerar chaves novas** no Supabase |
