# Farol

O raio-x do seu site em 30 segundos. Cole um endereço e receba um relatório visual, em português claro, com nota de 0 a 100 e a lista do que arrumar primeiro.

Toda decisão visual está no [DESIGN.md](DESIGN.md). Leia antes de mexer em qualquer tela.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Sem nenhuma variável de ambiente o Farol já funciona:

| Peça | Sem configurar | Configurado |
|---|---|---|
| Medição | Cota anônima da PageSpeed (costuma estar esgotada) | `PSI_API_KEY` |
| Relatórios | Arquivos JSON em `.data/reports/` | `DATABASE_URL` (Postgres) |
| Limite e cache | Memória do processo | `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` |
| Botão de WhatsApp | Escondido | `NEXT_PUBLIC_WHATSAPP_NUMBER` |

Copie `.env.example` para `.env.local` e preencha o que tiver.

Três relatórios reais de exemplo ficam em `data/examples/` e abrem sem configuração nenhuma, por exemplo em `/r/exemplo-gabrielvalenco`. Os componentes base ficam em `/dev/components` (só em desenvolvimento).

## Como a análise funciona

`POST /api/analyze` recebe `{ url }` e responde em NDJSON, um evento por linha, com o progresso real:

1. Normaliza a URL e bloqueia endereços internos (proteção contra SSRF).
2. Reaproveita o relatório se a mesma URL foi analisada nos últimos 10 minutos.
3. Aplica o limite de 5 análises a cada 10 minutos por IP.
4. Roda em paralelo a PageSpeed Insights (celular, 4 categorias) e o fetch do HTML com checagens próprias.
5. Monta o relatório (`lib/analysis/build-report.ts`), salva e devolve o endereço `/r/[slug]`.

Se o HTML falhar e a PageSpeed responder, o relatório sai marcado como análise parcial.

## Publicando na Vercel

1. Crie o repositório no GitHub e envie o código.
2. Na Vercel, importe o repositório. O framework é detectado sozinho.
3. Crie as contas e copie as credenciais para **Settings → Environment Variables**:
   - **PageSpeed:** no Google Cloud, crie um projeto, ative a *PageSpeed Insights API* e gere uma chave de API restrita a ela → `PSI_API_KEY`.
   - **Neon** ou **Supabase:** crie um banco Postgres e copie a connection string *pooled* → `DATABASE_URL`. A tabela é criada sozinha na primeira análise (SQL em `db/schema.sql`).
   - **Upstash:** crie um Redis e copie a REST URL e o token.
   - `NEXT_PUBLIC_SITE_URL` com o domínio final e, se quiser o botão de conversão, `NEXT_PUBLIC_WHATSAPP_NUMBER`.
4. Faça o deploy.

A rota de análise pede até 120 segundos de execução (`maxDuration`), coberto pelo plano gratuito da Vercel com Fluid Compute. Sites muito pesados podem levar a PageSpeed a desistir; nesse caso o Farol mostra "A medição não terminou".

## Estrutura

```
app/
  page.tsx                  landing
  r/[slug]/page.tsx         relatório
  r/[slug]/print/page.tsx   versão de impressão (PDF pelo navegador)
  api/analyze/route.ts      stream das etapas
  api/og/route.tsx          imagem de compartilhamento
components/                 componentes do DESIGN.md, report/ e ui/ (shadcn com tokens próprios)
lib/
  analysis/                 PSI, HTML, SSRF, montagem do relatório, tradução das verificações
  motion.ts score.ts copy.ts  fontes únicas de movimento, faixa de nota e texto
  storage.ts limits.ts      Postgres/arquivo e Upstash/memória
data/examples/              relatórios de exemplo versionados
```

## Scripts

```bash
npm run dev     # desenvolvimento
npm run build   # build de produção
npm run lint    # ESLint
```
