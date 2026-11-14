# Roteiro: do zero à produção com Next.js + Supabase + Vercel

> **Público:** quem quer colocar um app real no ar, não só "ver funcionando".
> **Duração estimada:** 30–40 min (dá pra cortar em 2 vídeos: Partes 0–2 e Partes 3–6).
> **Convenções:** trechos em _itálico_ são sugestões de fala. 🎬 = ação na tela. 💡 = conceito pra explicar. ⚠️ = cuidado de produção.

---

## Índice

0. Abertura: o que vamos construir e por quê
1. Entendendo as peças: o que é Supabase, o que é Vercel, como elas se encaixam
2. Preparação do projeto e GitHub
3. Banco de dados e chaves no Supabase
4. Deploy e variáveis de ambiente na Vercel
5. Teste final em produção
6. Antes de colocar SEU app em produção: checklist do mundo real
7. Encerramento
8. Anexo: problemas comuns e soluções

---

## Parte 0: Abertura (1 min)

🎬 Mostrar o app final rodando na URL da Vercel: adicionar uma tarefa, marcar como concluída, recarregar e mostrar que os dados continuam lá.

_"Esse é um app de tarefas simples, mas ele tem tudo o que um app de verdade precisa: um front-end publicado na internet, um banco de dados de verdade, leitura e escrita de dados, e deploy automático a cada alteração no código. E tudo isso sem configurar nenhum servidor e começando de graça."_

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

_"Antigamente você alugava um servidor, instalava banco, configurava Nginx, certificado SSL, fazia deploy por FTP ou SSH... Hoje dá pra terceirizar essas três coisas pra serviços especializados. O Supabase cuida de 1 e 2. A Vercel cuida de 3."_

### 1.2 O que é o Supabase

💡 **Supabase** é uma plataforma de back-end pronta (o termo técnico é "Backend as a Service", ou BaaS). Por baixo, é um banco **PostgreSQL** completo, com várias ferramentas em volta:

| Recurso | O que é | Usamos neste vídeo? |
|---|---|---|
| **Database** | Um PostgreSQL de verdade, o mesmo banco usado por grandes empresas | ✅ Sim |
| **API automática** | Cada tabela criada vira automaticamente uma API REST. Você não escreve back-end pra CRUD. | ✅ Sim (via `supabase-js`) |
| **Row Level Security (RLS)** | Regras dentro do banco que dizem quem pode ler/escrever cada linha | ✅ Sim |
| **Auth** | Login com e-mail, Google, GitHub etc. | ❌ Mencionado como próximo passo |
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

### 1.3 O que é a Vercel

💡 **Vercel** é uma plataforma de hospedagem e deploy feita pela mesma empresa que criou o **Next.js**. Você conecta seu repositório do GitHub e ela:

- **Faz o build** do projeto automaticamente a cada `git push`.
- **Publica** o site numa rede global (CDN), então ele carrega rápido em qualquer lugar do mundo.
- Dá **HTTPS de graça** e configura domínio próprio em poucos cliques.
- Cria **Preview Deployments**: cada branch ou Pull Request ganha uma URL própria pra testar antes de ir pro ar.
- Roda as partes "de servidor" do Next.js (API routes, Server Components) como **funções serverless**, sem você gerenciar servidor.

_"Na prática, o fluxo vira: escreveu código → `git push` → a Vercel faz o build e publica sozinha. Isso se chama **CI/CD** (integração e entrega contínuas), e antes dava trabalho configurar."_

**Por que Vercel?**
- Integração nativa com Next.js: zero configuração.
- Deploy automático pelo GitHub.
- Plano gratuito (Hobby) pra projetos pessoais.

**Quando considerar alternativas:**
- ⚠️ O plano **Hobby é para uso pessoal e não comercial**. Projeto de cliente ou que gera receita → plano **Pro** (confira os termos atuais na página de preços da Vercel).
- Alternativas: Netlify, Cloudflare Pages, Railway, Render ou uma VPS própria.

### 1.4 Como as peças se encaixam

🎬 Mostrar este diagrama na tela:

```
┌──────────────┐   git push   ┌──────────────┐
│  Seu código  │ ───────────▶ │    GitHub    │
└──────────────┘              └──────┬───────┘
                                     │ dispara build automático
                                     ▼
                              ┌──────────────┐
                              │    Vercel    │  build + hospeda o site
                              └──────┬───────┘
                                     │ entrega HTML/JS
                                     ▼
                              ┌──────────────┐
                              │  Navegador   │
                              │ do usuário   │
                              └──────┬───────┘
                                     │ supabase-js (HTTPS + anon key)
                                     ▼
                              ┌──────────────┐
                              │   Supabase   │  API + RLS + PostgreSQL
                              └──────────────┘
```

_"Repare: a Vercel entrega a página, e **o próprio navegador** conversa com o Supabase. Por isso a segurança não pode depender de esconder a chave. Ela depende das regras de RLS dentro do banco. Vamos ver isso na prática."_

### 1.5 Conceitos que vão aparecer no vídeo

💡 Explicar rapidamente, um por um:

- **Variáveis de ambiente:** configurações (URLs, chaves) que ficam **fora do código**. Assim o mesmo código roda em desenvolvimento e em produção com valores diferentes, e segredos não vão parar no GitHub.
- **`NEXT_PUBLIC_`:** prefixo do Next.js que diz "essa variável pode ir para o navegador". Sem o prefixo, ela só existe no servidor.
- **anon key:** chave **pública** do Supabase. Ela identifica o projeto, mas só permite o que as políticas de RLS liberarem.
- **service_role key:** chave **secreta** que **ignora o RLS**. ⚠️ Nunca no front-end, nunca com `NEXT_PUBLIC_`, nunca no GitHub.
- **RLS (Row Level Security):** "porteiro" dentro do banco. Com RLS ligado e nenhuma política, ninguém acessa nada. Cada política libera uma ação específica.
- **Build:** processo que transforma o código-fonte em arquivos otimizados prontos pra publicar.

---

## Parte 2: Preparação do projeto e GitHub (4 min)

### 2.1 Tour pelo projeto

🎬 Abrir o projeto no editor e mostrar arquivo por arquivo:

| Arquivo | Pra que serve |
|---|---|
| `package.json` | Lista as dependências: `next`, `react`, `react-dom` e `@supabase/supabase-js` (a biblioteca oficial que conversa com a API do Supabase) |
| `app/layout.js` | Estrutura HTML base de todas as páginas (App Router do Next.js) |
| `app/page.js` | A página principal: lista, adiciona e conclui tarefas, e mostra o indicador de conexão |
| `app/globals.css` | Estilos |
| `utils/supabase.js` | Cria **um único cliente** do Supabase lendo as variáveis de ambiente. Centralizar aqui evita repetir configuração. |
| `supabase-setup.sql` | Script que cria a tabela e as regras de segurança no banco |
| `.env.example` | **Modelo** das variáveis necessárias. Vai pro GitHub pra documentar o que o projeto precisa. |
| `.env.local` | Os **valores reais** das variáveis. **Não** vai pro GitHub. |
| `.gitignore` | Lista do que o Git deve ignorar |

🎬 Abrir `utils/supabase.js`:

_"Aqui a gente lê a URL e a chave das variáveis de ambiente. Se alguma estiver faltando, em vez de o app quebrar com um erro feio, ele mostra um aviso vermelho. Isso vai ser útil daqui a pouco."_

🎬 Abrir `.gitignore` e destacar `.env*.local`:

_"Essa linha é o que impede suas chaves de irem pro GitHub. Repositório público com chave vazada é um dos erros mais comuns, e existem robôs varrendo o GitHub atrás disso o tempo todo."_

### 2.2 Rodar localmente

🎬 No terminal:

```bash
npm install     # baixa as dependências listadas no package.json
npm run dev     # sobe o servidor de desenvolvimento
```

🎬 Abrir http://localhost:3000 → **aviso vermelho** "Variáveis faltando".

_"Isso é esperado: o `.env.local` está vazio. O app está avisando exatamente o que falta. Vamos guardar esse aviso, porque ele vai aparecer de novo na Vercel."_

### 2.3 Subir para o GitHub

💡 _"Por que GitHub? Além de guardar o histórico do código, é ele que vai **disparar os deploys** na Vercel. Cada push vira uma nova versão no ar."_

🎬 Criar repositório: github.com → **New repository** → nome `demo-supabase-vercel` → **sem** README, .gitignore ou licença (já temos os arquivos) → **Create**.

> Público ou privado? A Vercel funciona com os dois. Pra projeto real de cliente, use **privado**.

🎬 No terminal:

```bash
git init
git add .
git status        # 👀 conferir: .env.local NÃO pode aparecer na lista
git commit -m "Projeto inicial"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/demo-supabase-vercel.git
git push -u origin main
```

🎬 Atualizar a página do repositório e mostrar que **o `.env.example` está lá e o `.env.local` não**.

---

## Parte 3: Banco de dados e chaves no Supabase (8 min)

### 3.1 Criar o projeto

🎬 https://supabase.com → **Start your project** → login com GitHub → **New project**.

Preencher:
- **Name:** `demo-tarefas`
- **Database Password:** gerar uma senha forte e **guardar num gerenciador de senhas**.
  - _"Essa senha dá acesso direto ao Postgres. O app não vai usar, mas você vai precisar dela pra conectar ferramentas como DBeaver, fazer migrações ou backups."_
- **Region:** a mais próxima dos **seus usuários** (ex.: _South America (São Paulo)_ para público brasileiro).
  - 💡 _"Cada requisição viaja até o banco. Banco nos EUA com usuário no Brasil significa mais latência em todo clique. Não dá pra trocar a região depois sem migrar o projeto."_
- **Plan:** Free.

_"O projeto leva uns minutos pra ficar pronto. Enquanto isso, vamos entender o script SQL."_

### 3.2 Entendendo o `supabase-setup.sql`

🎬 Abrir o arquivo no editor e explicar bloco por bloco.

**Bloco 1: criar a tabela**

```sql
create table if not exists public.tarefas (
  id bigint generated always as identity primary key,
  titulo text not null,
  concluida boolean not null default false,
  created_at timestamptz not null default now()
);
```

- `id ... identity primary key`: número único gerado automaticamente pelo banco. _"Nunca é o front-end que inventa o ID."_
- `titulo text not null`: o banco **recusa** tarefas sem título. _"Validação no banco é a última linha de defesa: vale mesmo se alguém chamar a API sem passar pelo nosso formulário."_
- `concluida ... default false`: toda tarefa nasce pendente.
- `created_at timestamptz default now()`: data/hora com fuso horário, preenchida automaticamente.

**Bloco 2: ligar o RLS**

```sql
alter table public.tarefas enable row level security;
```

_"Lembra do diagrama? O navegador conversa direto com o banco usando uma chave pública. Sem RLS, **qualquer pessoa** com essa chave poderia ler, alterar e apagar tudo. Com o RLS ligado, o padrão vira 'ninguém pode nada', e a gente libera só o necessário."_

**Bloco 3: as políticas**

```sql
create policy "Leitura pública" on public.tarefas for select using (true);
create policy "Inserção pública" on public.tarefas for insert with check (true);
create policy "Atualização pública" on public.tarefas for update using (true) with check (true);
```

- `using`: filtra **quais linhas** a pessoa enxerga ou pode alterar.
- `with check`: valida **o dado novo** que está sendo gravado.
- `(true)`: "todo mundo pode".
- Repare que **não existe política de DELETE**. Logo, ninguém consegue apagar tarefas pela API. _"Isso é RLS funcionando: o que não foi liberado está bloqueado."_

⚠️ _"Essas políticas liberam geral **de propósito, pra demo**. No seu app de produção, as regras vão ser do tipo 'cada usuário só vê as próprias tarefas'. Mostro como na Parte 6."_

**Bloco 4: dados de exemplo**

_"Três tarefas iniciais pra gente ver algo na tela logo de cara."_

### 3.3 Rodar o script

🎬 No Supabase: menu lateral **SQL Editor** → **New query** → colar todo o conteúdo do `supabase-setup.sql` → **Run** (ou Ctrl+Enter).

- Esperado: `Success. No rows returned`.

🎬 Menu **Table Editor** → tabela `tarefas` → mostrar as 3 linhas.

🎬 Mostrar o selo **"RLS enabled"** na tabela. _"Se você criar uma tabela pelo Table Editor, o Supabase sugere ligar o RLS. **Sempre ligue.**"_

### 3.4 Pegar as chaves

🎬 Botão **Connect** no topo do painel (ou **Project Settings → API**). Copiar:

| No Supabase | Variável no projeto |
|---|---|
| **Project URL** (`https://xxxx.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon / public key** (ou *publishable key* em projetos mais novos) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

_"Repare que existe outra chave ali, a **service_role** (ou *secret key*). Ela ignora todas as regras de RLS. É como a chave mestra do prédio. Ela é só pra código de servidor e **jamais** pode ir pro front-end ou pro GitHub. Se vazar, gere outra na hora."_

> Em projetos novos, o Supabase pode mostrar o par "publishable / secret" no lugar de "anon / service_role". A lógica é a mesma: a publishable funciona no lugar da anon.

### 3.5 Conectar o app local

🎬 Abrir `.env.local` e colar:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

> Sem aspas e sem espaços antes ou depois do `=`.

🎬 No terminal: **Ctrl+C** e `npm run dev` de novo.

_"O Next.js lê as variáveis de ambiente só quando inicia. Mudou o `.env.local`, tem que reiniciar."_

🎬 Recarregar http://localhost:3000 → indicador **verde** e 3 tarefas.

### 3.6 Provar que está gravando no banco

🎬 Deixar o app e o **Table Editor** do Supabase lado a lado:
1. Adicionar a tarefa "Gravar vídeo" → atualizar o Table Editor → linha nova aparece.
2. Marcar uma tarefa como concluída → coluna `concluida` vira `true`.

_"Isso aqui já é a integração completa: leitura, escrita e atualização, passando pela API do Supabase e respeitando o RLS. Agora falta só colocar no ar."_

---

## Parte 4: Deploy e variáveis de ambiente na Vercel (7 min)

### 4.1 Importar o projeto

🎬 https://vercel.com → login **com GitHub** → **Add New… → Project** → autorizar acesso ao repositório → **Import** em `demo-supabase-vercel`.

🎬 Mostrar a tela de configuração:
- **Framework Preset:** Next.js (detectado sozinho).
- **Build Command:** `next build` (padrão, vem do `package.json`).
- **Root Directory:** `./`.

_"A Vercel olhou o `package.json`, viu que é Next.js e já sabe como fazer o build. Zero configuração."_

### 4.2 Demonstrar o erro (didático, recomendo manter no vídeo)

🎬 **Não** preencher Environment Variables → **Deploy**.

🎬 Mostrar o log do build passando e abrir a URL gerada (`demo-supabase-vercel-xxx.vercel.app`) → **aviso vermelho**.

_"Funcionou no meu computador, mas não em produção. Clássico! Por quê? O `.env.local` ficou só na minha máquina, porque o `.gitignore` impediu que ele fosse pro GitHub. Então a Vercel não conhece as chaves. E isso está **certo**: segredo não fica no repositório, fica configurado na plataforma."_

### 4.3 Configurar as variáveis

🎬 No projeto da Vercel: **Settings → Environment Variables**.

🎬 Adicionar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os mesmos valores do `.env.local`.

> Atalho: copie o conteúdo inteiro do `.env.local` e cole no campo **Key**. A Vercel separa as variáveis automaticamente.

💡 Explicar os **ambientes** que aparecem nos checkboxes:

| Ambiente | Quando é usado |
|---|---|
| **Production** | Deploy da branch `main`, a URL oficial |
| **Preview** | Deploys de outras branches e Pull Requests |
| **Development** | Quando você roda `vercel dev` ou `vercel env pull` na sua máquina |

_"Na demo marcamos os três com o mesmo banco. Em produção de verdade, o ideal é Preview apontar para um **projeto Supabase separado**, pra um teste numa branch nunca bagunçar os dados reais dos clientes."_

### 4.4 Redeploy (o passo que todo mundo esquece)

🎬 **Deployments** → último deploy → menu **⋯** → **Redeploy**.

💡 _"Por que precisa disso? Variáveis com `NEXT_PUBLIC_` são **embutidas no JavaScript na hora do build**. O build anterior foi feito sem elas, então o código publicado continua com elas vazias. Salvar a variável não basta: precisa gerar um build novo."_

🎬 Aguardar o build → abrir a URL → indicador **verde**, tarefas aparecendo.

### 4.5 Atalho: integração oficial Supabase ↔ Vercel

_"Existe também a integração oficial: na Vercel, em **Integrations → Supabase** (ou pelo Marketplace), você conecta os dois projetos e as variáveis são criadas automaticamente. Fiz manual aqui pra você entender o que acontece por baixo. Quando entender, use o atalho à vontade."_

> Atenção: a integração pode criar variáveis com nomes um pouco diferentes. Confira se os nomes batem com os que o código lê (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

---

## Parte 5: Teste final em produção (4 min)

_"Agora a prova real: os dados persistem em produção?"_

🎬 Na URL de produção:

1. Adicionar a tarefa **"Testando em produção 🚀"**.
2. Marcar outra como concluída.
3. **F5** → tudo continua lá.
   - _"Não é memória do navegador. Está gravado no Postgres."_
4. Abrir a mesma URL numa **aba anônima** ou **no celular** → mesmos dados.
   - _"Outro dispositivo, nenhum login, nenhum cache: os dados vêm do banco."_
5. **Table Editor** do Supabase lado a lado → a linha nova está lá.
6. Editar um título direto no **Table Editor** → F5 no app → a mudança aparece.
   - _"O banco é a fonte da verdade. O app só lê e escreve nele."_

### 5.1 Bônus: CI/CD na prática

🎬 Mudar o título em `app/page.js` (ex.: "📋 Minhas Tarefas" → "🚀 Tarefas em Produção") e rodar:

```bash
git add .
git commit -m "Muda título"
git push
```

🎬 Na Vercel, mostrar o novo deploy aparecendo sozinho em **Deployments** → quando terminar, F5 na URL.

_"Isso é deploy contínuo: nenhum FTP, nenhum servidor, só `git push`. E se der problema? Em **Deployments** você clica num deploy anterior e escolhe **Promote to Production** (ou **Instant Rollback**). Volta no ar em segundos."_

### 5.2 Bônus: Preview Deployment

🎬 Criar uma branch, alterar algo, dar push e abrir um Pull Request no GitHub → mostrar o comentário da Vercel com a **URL de preview**.

_"Cada PR ganha uma URL própria. Você manda pro cliente aprovar antes de ir pra produção."_

---

## Parte 6: Antes de colocar SEU app em produção (6 min)

> _"Tudo o que fizemos até aqui funciona, mas foi pensado pra demo. Se você vai colocar um projeto real no ar, com usuários e dados de verdade, preste atenção nesta parte."_

### 6.1 Segurança: troque as políticas públicas ⚠️ (obrigatório)

_"As políticas da demo deixam qualquer pessoa na internet ler e editar a tabela. Num app real, cada usuário só deve mexer nos próprios dados. O caminho é: ligar o **Supabase Auth** (login), guardar o dono de cada linha e escrever políticas com base nele."_

🎬 Mostrar este exemplo (não precisa rodar):

```sql
-- 1. Coluna com o dono da tarefa (preenchida automaticamente com o usuário logado)
alter table public.tarefas
  add column user_id uuid references auth.users not null default auth.uid();

-- 2. Remover as políticas públicas da demo
drop policy "Leitura pública" on public.tarefas;
drop policy "Inserção pública" on public.tarefas;
drop policy "Atualização pública" on public.tarefas;

-- 3. Cada usuário logado só vê e altera as próprias tarefas
create policy "Dono lê" on public.tarefas
  for select to authenticated using (auth.uid() = user_id);

create policy "Dono cria" on public.tarefas
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Dono atualiza" on public.tarefas
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

> Em tabela com dados existentes, a coluna `not null` falha nas linhas antigas. Limpe a tabela antes ou adicione a coluna como nullable e preencha depois.

**Outras regras de segurança:**
- **Toda tabela no schema `public` com RLS ligado.** O Supabase mostra alertas no **Security Advisor** (menu Advisors). Revise antes de lançar.
- **`service_role` / secret key só no servidor**, sem `NEXT_PUBLIC_`. Se vazar: gere outra imediatamente em Settings → API.
- **Validação no banco** (`not null`, `check`, tamanho máximo) além da validação no formulário. Exemplo: `alter table tarefas add constraint titulo_tamanho check (char_length(titulo) <= 200);`
- Se usar **Auth**: configure em **Authentication → URL Configuration** o **Site URL** com seu domínio de produção e adicione as URLs da Vercel em **Redirect URLs**. Sem isso, o login redireciona pra `localhost`.

### 6.2 Ambientes separados

| | Desenvolvimento / Preview | Produção |
|---|---|---|
| Projeto Supabase | `meuapp-dev` | `meuapp-prod` |
| Variáveis na Vercel | marcadas em **Preview** e **Development** | marcadas em **Production** |

_"Assim um teste numa branch nunca apaga dados de cliente. Para levar mudanças de banco do dev para o prod de forma controlada, use **migrações** com a Supabase CLI (`supabase migration new`, `supabase db push`) em vez de colar SQL na mão em produção."_

### 6.3 Planos, limites e custos

⚠️ Confira sempre as páginas de preços atualizadas. Pontos que costumam pegar quem está começando:

- **Supabase Free:** projetos **pausam após um período sem atividade** (hoje, cerca de 1 semana), e o plano tem limites de tamanho de banco, armazenamento e tráfego. **Não tem backup automático com restauração self-service**. Pra produção com clientes, avalie o plano **Pro**.
- **Vercel Hobby:** **uso pessoal e não comercial**. Projeto de cliente ou com receita → **Pro**. Também tem limites de banda e execução de funções.
- Ative **alertas de uso/gasto** nas duas plataformas pra não ser surpreendido.

### 6.4 Domínio próprio

🎬 (Opcional, mostrar rapidamente) Vercel → **Settings → Domains** → adicionar `meuapp.com.br` → configurar o DNS (registro A ou CNAME) no seu provedor (Registro.br, Cloudflare etc.). O HTTPS é emitido automaticamente.

_"Se usar Supabase Auth, lembre de atualizar o Site URL com o domínio novo."_

### 6.5 Monitoramento e backups

- **Vercel:** aba **Logs** (erros em tempo real) e **Analytics / Speed Insights** (desempenho real dos usuários).
- **Supabase:** **Logs Explorer** (requisições à API e erros do banco), **Reports** (uso) e **Database → Backups** (nos planos pagos).
- Mesmo no plano gratuito, faça um backup manual periódico: `supabase db dump` (CLI) ou `pg_dump` usando a connection string do painel.

### 6.6 Checklist final antes do lançamento

- [ ] RLS ligado em **todas** as tabelas, sem políticas `using (true)` em dados sensíveis
- [ ] Security Advisor do Supabase sem alertas críticos
- [ ] Nenhuma chave secreta no código, no GitHub ou com prefixo `NEXT_PUBLIC_`
- [ ] Projetos Supabase separados pra dev e prod
- [ ] Variáveis de ambiente configuradas por ambiente na Vercel + redeploy feito
- [ ] Plano adequado ao uso (comercial = planos pagos)
- [ ] Domínio próprio com HTTPS
- [ ] URLs de Auth configuradas (se usar login)
- [ ] Estratégia de backup definida
- [ ] Alertas de gasto ativados

---

## Parte 7: Encerramento (1 min)

_"Recapitulando:"_

1. _"**Supabase** nos deu um banco Postgres com API pronta e segurança por RLS, sem escrever back-end."_
2. _"**Vercel** fez o build e publicou o app com HTTPS e deploy automático a cada `git push`."_
3. _"**Variáveis de ambiente** ligam as duas pontas: ficam fora do código e configuradas em cada ambiente."_
4. _"Pra produção de verdade: login com Supabase Auth, políticas por usuário, ambientes separados e o plano certo."_

_"O código deste projeto está no link da descrição. No próximo vídeo, a gente adiciona login e transforma essas políticas públicas em políticas por usuário. Até lá!"_

---

## Anexo: problemas comuns e soluções

| Sintoma | Causa provável | Solução |
|---|---|---|
| Aviso vermelho local | `.env.local` vazio ou servidor não reiniciado | Preencher e reiniciar `npm run dev` |
| Aviso vermelho na Vercel | Variáveis não cadastradas ou sem redeploy | Settings → Environment Variables → **Redeploy** |
| Verde na Vercel só em Preview (ou só em Production) | Variável marcada só num ambiente | Editar a variável e marcar os ambientes certos → Redeploy |
| `relation "public.tarefas" does not exist` | Script SQL não executado ou executado em outro projeto | Rodar `supabase-setup.sql` no projeto certo |
| `new row violates row-level security policy` | Faltou a política de INSERT/UPDATE | Rodar o script completo (em projeto limpo) |
| Lista vazia sem erro, mas há dados no Table Editor | Faltou a política de SELECT | Criar a política de leitura |
| `Invalid API key` | Chave copiada errada (espaço, quebra de linha, chave truncada) | Copiar de novo a anon/publishable key |
| `policy "..." already exists` ao rodar o script de novo | Script já executado antes | Ignorar, ou dar `drop policy` antes de recriar |
| App parou de funcionar depois de dias parado | Projeto Supabase Free pausado por inatividade | Painel do Supabase → **Restore project** |
| `.env.local` apareceu no `git status` | `.gitignore` ausente ou alterado | Conferir `.gitignore`; se já commitou, **gerar chaves novas** no Supabase |
