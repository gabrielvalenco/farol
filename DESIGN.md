# Farol, Design System & UI Spec

> Documento de referência de design para o projeto **Farol**.
> Leia este arquivo antes de criar ou alterar qualquer componente de UI.
> Toda decisão visual do projeto sai daqui. Se algo não estiver definido aqui,
> siga os **Princípios** da seção 1 e depois documente a decisão neste arquivo.

---

## 0. O produto em uma frase

**Farol** analisa qualquer site em menos de um minuto e entrega um relatório visual,
em português claro, com nota de 0 a 100 e uma lista priorizada do que arrumar.

**Dois públicos, uma interface:**

1. **Quem roda a análise** (dev/freelancer): quer velocidade, densidade de dados, atalhos.
2. **Quem recebe o link do relatório** (dono de um comércio local, sem background técnico):
   quer entender em 10 segundos se o site dele está bom ou ruim, e por quê.

O design precisa servir o público 2 sem entediar o público 1. Na prática:
**hierarquia brutal**. O número grande e o veredito em linguagem humana primeiro,
o detalhe técnico progressivamente revelado abaixo.

---

## 1. Princípios de design

Sete regras. Em qualquer dúvida de implementação, volte aqui.

1. **O dado é o herói.** Nenhum elemento decorativo pode competir com um número,
   um score ou um screenshot. Cromo (bordas, fundos, ícones) sempre em baixo contraste.
2. **Slim.** Bordas de 1px em cinza claro no lugar de sombras. Cards com fundo branco
   sobre off-white, não branco sobre branco com sombra pesada. Altura de header
   de 56px, não 80px. Nada de padding "generoso" em componentes de UI, o respiro
   vem do espaço *entre* blocos, não *dentro* deles.
3. **Um acento só.** Azul para ação e marca. As cores semânticas (verde, âmbar,
   vermelho) existem exclusivamente para comunicar score. Nunca use verde
   para um botão de sucesso, nunca use o azul de marca em um gráfico.
4. **Movimento com propósito.** Toda animação responde a uma destas perguntas:
   "de onde isso veio?", "isso está carregando?", "o que mudou?". Animação
   que não responde nenhuma das três é ruído, remova.
5. **Português de gente.** Nenhuma sigla aparece sozinha na UI. "LCP" sempre
   acompanhado de "Tempo até o conteúdo principal aparecer". Ver seção 9.
6. **Zero estética de template de IA.** Sem gradiente roxo, sem glassmorphism,
   sem blobs desfocados no fundo, sem emoji como ícone, sem badge "✨ Powered by AI".
7. **Rápido antes de bonito.** Se uma animação atrasa a leitura do dado,
   a animação perde. Nada bloqueia a renderização do conteúdo.

**Referências de tom:** Stripe (tipografia e respiro), Linear (densidade e motion),
Vercel (neutros e bordas). **Não** é: Dribbble, landing page de startup cripto,
dashboard com 40 gradientes.

---

## 2. Identidade

- **Nome:** Farol
- **Wordmark:** `Farol` em Inter, weight 600, `letter-spacing: -0.03em`, cor `--ink-900`.
  Ao lado, o mark.
- **Mark:** um círculo de 20px com dois arcos concêntricos abrindo para a direita
  (feixe de farol), desenhado em SVG com `stroke-width: 1.75`, `stroke-linecap: round`.
  Arco interno em `--accent`, arco externo em `--accent` com `opacity: 0.35`.
  Sem preenchimento. O mark nunca aparece sozinho fora do favicon.
- **Tagline:** "O raio-x do seu site em menos de um minuto."
- **Tom de voz:** direto, sem hype, sem gerundismo. Fala o problema e o custo do
  problema. "Seu site demora 4,2s pra carregar. Metade dos visitantes desiste antes disso."

---

## 3. Design tokens

Implementar como CSS variables no `globals.css`, expostas ao Tailwind v4
via `@theme inline`. **Nenhum valor hardcoded em componente.**

### 3.1 Cor

```css
:root {
  /* Neutros (base de tudo) */
  --bg:           #FFFFFF;   /* fundo de card, superfície elevada */
  --bg-subtle:    #FAFAFA;   /* fundo da página */
  --bg-muted:     #F4F5F7;   /* hover de linha, skeleton base */

  --ink-900:      #0B0D12;   /* títulos, números grandes */
  --ink-700:      #383D47;   /* corpo de texto */
  --ink-500:      #6B7280;   /* texto secundário, labels */
  --ink-400:      #9CA3AF;   /* placeholder, texto desabilitado */

  --line:         #EAECF0;   /* borda padrão, 1px */
  --line-strong:  #D8DCE3;   /* borda de input em hover/focus */

  /* Acento (marca e ação) */
  --accent:       #2F5BFF;
  --accent-hover: #1E45E0;
  --accent-soft:  #EEF2FF;   /* fundo de badge/chip de acento */
  --accent-ring:  rgba(47, 91, 255, 0.35);  /* focus ring */

  /* Semântica de score (USO EXCLUSIVO em score/status) */
  --good:         #0E9F6E;
  --good-soft:    #E7F7F0;
  --warn:         #D98A00;
  --warn-soft:    #FDF4E3;
  --bad:          #E0413F;
  --bad-soft:     #FDEDEC;

  /* Sombras: sutis, sempre em duas camadas */
  --shadow-xs: 0 1px 2px rgba(11, 13, 18, 0.04);
  --shadow-sm: 0 1px 2px rgba(11, 13, 18, 0.04), 0 2px 6px rgba(11, 13, 18, 0.04);
  --shadow-md: 0 2px 4px rgba(11, 13, 18, 0.04), 0 8px 20px rgba(11, 13, 18, 0.06);
  /* Não existe shadow-lg/xl neste projeto. Se precisar, você errou a hierarquia. */
}
```

**Regra de faixa de score** (única fonte de verdade, use em todo lugar):

| Faixa | Cor | Rótulo em PT | Ícone (Lucide) |
|---|---|---|---|
| 90 a 100 | `--good` | "Bom" | `check-circle-2` |
| 50 a 89 | `--warn` | "Precisa de atenção" | `alert-triangle` |
| 0 a 49 | `--bad` | "Crítico" | `alert-octagon` |

Cor **nunca** é o único canal de informação: sempre acompanha rótulo + ícone.

### 3.2 Tipografia

- **Fonte:** Inter Variable via `next/font/google`, com `display: 'swap'`.
  Fallback: `system-ui, -apple-system, "Segoe UI", sans-serif`.
- **Números:** sempre `font-variant-numeric: tabular-nums`. Crie uma classe
  utilitária `.tnum` e aplique em todo score, métrica e contador.
- **Tracking negativo em tamanhos grandes** é o que dá o ar "Stripe". Não esqueça.

| Token | Tamanho / Linha | Weight | Tracking | Uso |
|---|---|---|---|---|
| `display` | 64 / 1.0 | 600 | -0.04em | Score principal do relatório |
| `h1` | 44 / 1.08 | 600 | -0.035em | Título da landing |
| `h2` | 30 / 1.2 | 600 | -0.025em | Título de seção |
| `h3` | 19 / 1.35 | 600 | -0.015em | Título de card |
| `body` | 15 / 1.6 | 400 | 0 | Texto corrido |
| `body-sm` | 13.5 / 1.55 | 400 | 0 | Descrição dentro de card |
| `label` | 12 / 1.3 | 500 | 0.02em | Labels, eixos, metadados |
| `mono` | 13 / 1.5 | 400 | 0 | URLs, seletores CSS, valores técnicos |

Mono: `Geist Mono` ou `ui-monospace`. Usada só para conteúdo literal (URL analisada,
tag HTML encontrada), nunca para decoração.

Mobile: `display` cai para 48, `h1` para 32, `h2` para 24. Use `clamp()`.

### 3.3 Espaço, raio e borda

- **Base 4px.** Escala: 4, 8, 12, 16, 20, 24, 32, 40, 56, 80, 120.
- **Raio:** `--r-sm: 8px` (badge, input), `--r-md: 12px` (card, botão),
  `--r-lg: 16px` (bloco hero, modal), `--r-full: 9999px` (chip, avatar).
  **Nada acima de 16px.** Raio grande demais mata o ar "slim".
- **Borda:** sempre `1px solid var(--line)`. Nunca 2px. Nunca borda colorida
  em card, exceto o card do problema crítico #1 (borda esquerda de 2px em `--bad`).

### 3.4 Layout

- Container: `max-width: 1120px`, padding lateral 24px (16px no mobile).
- Container de leitura (texto corrido do relatório): `max-width: 720px`.
- Grid: 12 colunas, gap 24px. No mobile, coluna única, gap 16px.
- Ritmo vertical entre seções: 80px no desktop, 56px no mobile.
- **Header:** 56px de altura, `position: sticky`, fundo `--bg` com
  `backdrop-filter: blur(12px)` e `background: rgba(255,255,255,0.92)` (revisado: 0.85 deixava o conteúdo legível por trás),
  borda inferior de 1px que **só aparece depois de 8px de scroll**
  (transição de 200ms na `border-color`). Esse detalhe sozinho já eleva o nível.

---

## 4. Sistema de movimento

**Biblioteca:** `motion` (o pacote sucessor do framer-motion, `npm i motion`,
import de `motion/react`). Não use bibliotecas de animação adicionais.
CSS transition resolve hover e press, não traga JS pra isso.

### 4.1 Durações e curvas

```ts
export const duration = {
  instant: 0.12,  // troca de estado de ícone, ripple de checkbox
  fast:    0.18,  // hover, press, tooltip
  base:    0.26,  // entrada de elemento, fade-up
  slow:    0.42,  // entrada de seção, expansão de accordion
  score:   0.9,   // desenho do anel + contagem do número (uma vez só)
} as const;

export const ease = {
  out:   [0.22, 1, 0.36, 1],    // padrão para entradas
  inOut: [0.65, 0, 0.35, 1],    // para movimentos que voltam
  in:    [0.4, 0, 1, 1],        // saídas
} as const;

export const spring = {
  soft:  { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 },
  snug:  { type: 'spring', stiffness: 420, damping: 34 },
} as const;
```

**Nada passa de 900ms.** Se uma animação precisa de mais tempo pra funcionar,
o problema é a animação.

### 4.2 Animações nomeadas (crie um `lib/motion.ts` e reutilize)

| Nome | Comportamento |
|---|---|
| `fadeUp` | `opacity 0 → 1`, `y: 8px → 0`, `duration.base`, `ease.out` |
| `fadeIn` | só opacidade, `duration.base` |
| `stagger` | container com `staggerChildren: 0.05`, `delayChildren: 0.06` |
| `scaleIn` | `scale: 0.97 → 1` + fade, `spring.snug`, para popover e tooltip |
| `collapse` | `height: 0 → auto` + fade do conteúdo, `duration.slow`, `ease.inOut` |
| `drawRing` | `strokeDashoffset` do total até o valor do score, `duration.score`, `ease.out` |
| `countUp` | `useMotionValue` + `animate`, mesma duração do `drawRing`, arredonda no render |
| `shimmer` | gradiente de 200% de largura deslizando em 1.4s linear infinite (skeleton) |

### 4.3 Regras de aplicação

- **Entrada em scroll:** `whileInView` com `viewport={{ once: true, margin: '-80px' }}`.
  Nunca reanime ao subir a página.
- **Stagger só no primeiro nível.** Lista de 6 problemas: stagger nos 6 cards.
  Dentro do card, nada anima em cascata.
- **Hover:** exclusivamente `background-color`, `border-color`, `color` e `transform: translateY(-1px)`.
  Nunca `scale` em card, nunca sombra crescendo.
- **Press:** `transform: scale(0.985)` em `duration.instant`. Aplicar em botão e card clicável.
- **Layout shift:** proibido. Reserve a altura de tudo que carrega (skeleton com
  a dimensão exata do conteúdo final).
- **Entrada de página:** uma única `fadeUp` no bloco principal, 0 delay.
  Não faça a página inteira aparecer em cascata, parece lento.

### 4.4 `prefers-reduced-motion`

Obrigatório, não opcional:

- Desliga todo `transform` e `stagger`.
- Mantém fades de até 150ms.
- `countUp` e `drawRing` vão direto ao valor final, sem animar.
- `shimmer` vira um pulse de opacidade suave.

Implemente com o hook `useReducedMotion()` do `motion/react` **e** com
`@media (prefers-reduced-motion: reduce)` no CSS. Os dois, porque nem toda
animação passa pelo JS.

---

## 5. Telas

### 5.1 Landing / Home (`/`)

Uma tela, uma ação. Nada de seção de "features" com três ícones.

**Composição (de cima pra baixo):**

1. **Header slim** (56px): wordmark à esquerda, link "Como funciona" e
   "Ver exemplo" à direita em `body-sm` / `--ink-500`.
2. **Hero centralizado**, começando a ~18vh do topo:
   - `h1`: "Descubra o que está travando o seu site."
   - Subtítulo em `body` / `--ink-500`, max 520px: "Análise completa de performance,
     SEO e acessibilidade em menos de um minuto. De graça."
   - **O campo de URL é o protagonista.** Ver 6.1.
   - Abaixo, em `label` / `--ink-400`: "Sem cadastro. Sem cartão."
3. **Prova social discreta:** uma linha com 3 ou 4 domínios já analisados
   em `mono` / 12px / `--ink-400`, separados por um ponto médio. Sem logos.
4. **"O que você recebe":** grid de 4 itens (Performance, SEO, Acessibilidade,
   Boas práticas), cada um com ícone Lucide 18px em `--ink-400`, título em `h3`
   e uma linha de descrição. Sem card, sem borda, só texto em grid. Slim.
5. **Footer** de 1 linha.

**Motion:** o hero entra com `fadeUp` (sem stagger, é um bloco só).
Os 4 itens entram com `stagger` no `whileInView`.

### 5.2 Estado de análise (o momento mais importante do produto)

A PSI leva de 30 a 60 segundos, às vezes mais. Esse tempo é oportunidade, não problema:
é onde o produto parece competente. **Não use um spinner.**

**Comportamento:** ao dar submit, o campo de URL **não some**. Ele se transforma:
a altura cresce com `layout` do motion, o botão vira um indicador de progresso,
e abaixo do campo aparece uma lista de etapas.

**Etapas (aparecem uma a uma, com o status real vindo do stream do backend):**

```
Buscando o site...
Medindo a velocidade de carregamento...
Analisando SEO e metadados...
Verificando acessibilidade...
Montando o relatório...
```

Cada linha: ícone à esquerda (16px), texto em `body-sm`.
- **Pendente:** `--ink-400`, ícone de círculo vazio 1px.
- **Em andamento:** `--ink-900`, ícone de círculo com um arco girando
  (rotação de 1s linear infinite, `stroke-width: 1.5`).
- **Concluída:** `--ink-500`, ícone `check` em `--good`, e a linha faz um
  `fadeIn` do check com `spring.snug`.

À direita do bloco, quando a PSI devolver o screenshot em base64, ele entra
com `fadeIn` + `scale 0.98 → 1` dentro de um mockup de browser slim
(barra de 28px com três círculos de 8px em `--line` e a URL em `mono` 11px).
Esse é o "uau" do carregamento: o usuário vê o próprio site aparecer.

**Barra de progresso:** 2px de altura, largura total do bloco, `--accent`,
avança por etapa com `ease.out`. Nunca anime até 100% antes do resultado chegar,
e nunca deixe travada: se uma etapa demora mais de 6s, avance lentamente
até 90% da fatia dela.

**Acessibilidade:** o container das etapas é `aria-live="polite"`,
e cada mudança de status anuncia o texto da etapa.

### 5.3 Relatório (`/r/[slug]`)

A tela que vai ser mandada no WhatsApp. Ela precisa funcionar pra quem nunca
ouviu falar de Lighthouse.

**Ordem de leitura:**

1. **Header do relatório** (não é o header do site): domínio analisado em `h3`,
   favicon do site 16px à esquerda, data da análise em `label` / `--ink-400`,
   e à direita botões `Reanalisar` (secundário) e `Compartilhar` (primário).
   Ao rolar, esse bloco colapsa dentro do header sticky, mostrando domínio +
   um chip pequeno com o score. Transição de 200ms.

2. **Veredito.** O bloco mais importante da aplicação.
   - À esquerda: **ScoreRing** de 168px com o número em `display`.
   - À direita: uma frase em `h2` que traduz o número.
     `90+`: "Seu site está em ótima forma."
     `50 a 89`: "Seu site funciona, mas está deixando visitantes na mesa."
     `<50`: "Seu site está perdendo clientes agora."
     Abaixo, em `body` / `--ink-500`, duas linhas com o impacto concreto
     (tempo de carregamento e quantos problemas críticos foram encontrados).
   - Sem card, sem borda. Esse bloco respira direto no fundo da página.

3. **Quatro sub-scores** em grid de 4 colunas (2 no mobile).
   Cada um: label em `label` maiúscula, número em 28/600 `.tnum` na cor da faixa,
   e uma barra de 3px de trilho `--bg-muted` preenchida na cor da faixa.
   A barra anima de 0 até o valor com `duration.slow` e delay escalonado de 60ms.

4. **"Comece por aqui"**: os 3 a 5 problemas de maior impacto, como cards
   em coluna única. Ver 6.3. O primeiro card tem borda esquerda de 2px na cor
   da severidade. Cada card é expansível e mostra: o que é, por que importa
   (em português de gente), e como resolver.

5. **Core Web Vitals**: 3 métricas em linha, cada uma com o valor grande,
   o nome humano em cima e a sigla em `mono` pequena embaixo, mais uma
   régua horizontal marcando as faixas bom/atenção/ruim com um pin na posição atual.

6. **Todas as verificações**: accordion por categoria, com contador
   ("SEO, 11 de 14 aprovadas"). Fechado por padrão. Aqui é onde o público
   técnico se satisfaz sem poluir a leitura do público leigo.

7. **Rodapé de conversão**: bloco slim com fundo `--bg-muted`, raio 16,
   texto "Quer que a gente arrume isso pra você?" e um botão que abre o WhatsApp.
   Esse bloco é configurável por env var, é o que transforma o projeto em ferramenta comercial.

### 5.6 Antes e depois (`/casos/[slug]`)

A prova de que o Farol serve pra alguma coisa: um site real, medido antes e
depois das correções, do mesmo jeito. Os números são o argumento; nada de
depoimento ou adjetivo.

**Ordem de leitura:**

1. **Hero centralizado:** `label` "Exemplo · antes e depois · domínio", `h1` com os dois números
   ("De 60 para 96, com o mesmo visual") e uma linha de impacto. Abaixo, dois
   `ScoreRing` lado a lado com uma seta e o chip "+N pontos". O anel de depois
   começa a desenhar 500ms depois do de antes.
2. **Os números que mudaram:** grade de 6 cards (performance, tempo até o conteúdo
   principal, peso, estabilidade, travamento, arquivos). Em cada um, o valor de antes riscado
   em `--ink-500`, uma seta e o valor de depois em 28/600, que conta de antes pra depois
   quando entra na tela. Um chip com o ganho ("2,6x mais rápido").
3. **O peso em escala:** duas barras na mesma régua (`--bad` e `--good`). A diferença aparece
   do tamanho real, sem eixo quebrado.
4. **Nota por categoria:** duas barras finas por categoria, antes em 45% de opacidade.
5. **O que foi feito:** cards numerados, com título, explicação em português de gente
   e o efeito medido em mono `--good-ink`.
6. **Problemas resolvidos:** "N de M" com uma régua de M segmentos, e a lista dos
   resolvidos (check) e dos que continuam (círculo tracejado, `--ink-500`).
7. **Relatórios completos** de antes e depois, e a nota de método com a data.
8. **Conversão:** bloco `--bg-muted` com "Analisar meu site" e, se configurado, WhatsApp.

**Regras:**

- As duas versões são medidas do mesmo jeito (mesma máquina, mesmas flags, mediana de 3),
  e o método aparece na página. Número que não foi medido não entra.
- Números e barras chegam do servidor no valor final. Só um bloco que ainda está fora da tela
  volta pro valor de antes e anima ao aparecer, o que evita piscar e layout shift.
- Na landing, um card de destaque (`CaseTeaser`) leva ao caso, com os anéis parados.
- Os relatórios de um caso mostram uma faixa `--accent-soft` com link pra comparação.
- Gerado por `npm run case:build` a partir de dois JSON do Lighthouse
  (`data/cases/<slug>.json` e `data/examples/caso-<slug>-antes|depois.json`).

### 5.4 Versão de impressão (`/r/[slug]/print`)

Mesma rota, CSS `@media print`: remove header sticky, remove botões, força
todos os accordions abertos, quebra de página antes de "Todas as verificações",
cores forçadas com `print-color-adjust: exact`. É assim que se gera o PDF,
nada de Puppeteer.

### 5.5 Imagem de OG (`/api/og`)

Gerada com `@vercel/og`, 1200x630, fundo `--bg-subtle`:
o score gigante à esquerda na cor da faixa, o domínio em 48/600 à direita,
o wordmark Farol no rodapé. É o que aparece quando o link cai no WhatsApp,
trate com o mesmo cuidado de uma tela.

---

## 6. Componentes

Use shadcn/ui como base (`button`, `input`, `accordion`, `badge`, `tooltip`,
`skeleton`, `sonner`), mas **reescreva os tokens** para os desta spec.
Os componentes abaixo são feitos à mão.

### 6.1 `<UrlInput />`

O componente mais importante da landing.

- Container de 56px de altura, raio 12, borda 1px `--line`, fundo `--bg`,
  `--shadow-xs`. Largura 100%, max 560px.
- Ícone `globe` 18px `--ink-400` à esquerda, padding 16px.
- Input sem borda própria, `body` 16px (16px evita o zoom automático no iOS),
  placeholder "seusite.com.br".
- Botão primário dentro do container, colado à direita, 40px de altura,
  margem de 8px.
- **Focus:** borda vira `--line-strong` e aparece um ring de 3px em `--accent-ring`,
  transição de 150ms. Sem `outline` do browser.
- **Erro:** borda `--bad`, shake horizontal de 3 oscilações em 220ms
  (`x: [0,-4,4,-2,0]`), mensagem em `body-sm` / `--bad` aparecendo com `fadeUp`
  logo abaixo, e `aria-invalid` no input.
- Normalize a URL no cliente (aceita `site.com.br`, `www.site.com.br`, com ou sem `https`).

### 6.2 `<ScoreRing />`

SVG feito à mão, sem biblioteca de gráfico.

- Props: `value` (0 a 100), `size` (168 no hero, 64 nos cards), `label`.
- Dois círculos: trilho em `--bg-muted`, progresso na cor da faixa.
- `stroke-width`: `size * 0.06`, arredondado (`stroke-linecap: round`).
  Anel fino, isso é o que dá o ar slim. Nada de anel gordo.
- Começa às 12h (`transform: rotate(-90deg)`).
- Animação: `strokeDashoffset` do vazio até o valor + número contando em paralelo,
  `duration.score`. Dispara com `whileInView once`.
- O número fica no centro em `display` `.tnum`, com o "/100" em 40% do tamanho,
  weight 400, `--ink-400`, alinhado à baseline.
- Com `prefers-reduced-motion`, renderiza no valor final direto.

### 6.3 `<IssueCard />`

- Card: fundo `--bg`, borda 1px `--line`, raio 12, padding 20px.
- **Fechado:** ícone de severidade 18px, título em `h3`, e à direita um
  `<ImpactBadge />`. Um chevron de 16px em `--ink-400` na ponta.
- **Hover:** `border-color: --line-strong` + `translateY(-1px)`, 180ms. Só isso.
- **Aberto:** o chevron gira 180° em 200ms, o conteúdo expande com `collapse`.
  Dentro: parágrafo "O que é", parágrafo "Por que importa" e um bloco
  "Como resolver" em `--bg-muted` com raio 8. Se houver elementos afetados,
  liste em `mono` 13px, no máximo 5 com um "e mais N".
- Um card aberto **não fecha os outros**. Não é um accordion exclusivo.

### 6.4 `<ImpactBadge />`

Chip de 22px, raio full, `label` 11px weight 500, padding lateral 8px.
`Alto impacto` em `--bad-soft`/`--bad`, `Médio` em `--warn-soft`/`--warn`,
`Baixo` em `--bg-muted`/`--ink-500`. Sem borda.

### 6.5 `<MetricGauge />` (Core Web Vitals)

Régua horizontal de 4px, raio full, dividida em três segmentos proporcionais
(bom / atenção / ruim) nas cores soft correspondentes. Um pin vertical de 2px
por 12px em `--ink-900` marca a posição do valor medido, entrando com
`spring.soft` e delay de 200ms. Valor numérico acima em 24/600 `.tnum`.

### 6.6 `<Skeleton />`

Blocos com `--bg-muted`, raio igual ao do componente final, e `shimmer`.
**Dimensões idênticas ao conteúdo real.** Um skeleton que causa reflow
ao ser substituído é pior que nenhum skeleton.

### 6.7 Botões

- **Primário:** fundo `--accent`, texto branco, 40px de altura (36px na versão `sm`),
  raio 10, `body-sm` weight 500, padding lateral 16px.
  Hover: `--accent-hover`. Press: `scale(0.985)`.
  Loading: o texto é substituído por um spinner de 14px **mantendo a largura original**.
- **Secundário:** fundo `--bg`, borda 1px `--line`, texto `--ink-700`.
  Hover: fundo `--bg-muted`.
- **Ghost:** só texto `--ink-500`, hover `--ink-900` + fundo `--bg-muted`.
- Todo botão tem `transition: all 150ms` e um focus ring de 3px `--accent-ring`
  com `offset: 2px`.

---

## 7. Estados

Nenhuma tela está pronta sem os quatro estados. Especifique e implemente todos.

| Estado | Tratamento |
|---|---|
| **Carregando** | Skeleton com dimensão exata. Nunca spinner de página inteira. |
| **Site inacessível** (timeout, DNS, 500) | Ilustração não, ícone `plug-zap` 32px em `--ink-400`, título "Não conseguimos acessar esse site", corpo explicando as causas possíveis (site fora do ar, bloqueio de robô, domínio errado) e botão "Tentar de novo". |
| **Análise parcial** (a PSI respondeu, o fetch do HTML não) | Mostre o que tem, e um aviso slim no topo da seção incompleta: fundo `--warn-soft`, raio 8, ícone 16px, texto em `body-sm`. Nunca mostre erro na tela inteira quando 80% do dado chegou. |
| **Rate limit** | Mensagem direta com o tempo restante: "Você já analisou 5 sites nos últimos 10 minutos. Tente de novo em 4 minutos." Sem culpar o usuário. |

---

## 8. Responsivo

Mobile-first. Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`.

- `ScoreRing` do hero: 168px no desktop, 128px no mobile, e o bloco de veredito
  passa de lado a lado para empilhado (anel em cima, centralizado).
- Sub-scores: 4 colunas → 2 colunas.
- O bloco de análise (5.2): no mobile o screenshot vai **abaixo** das etapas, não ao lado.
- O rodapé de conversão vira um CTA fixo no fim da tela no mobile
  (`position: sticky; bottom: 0`), com fundo sólido e borda superior de 1px.
  Aparece só depois de 60% de scroll, entrando com `y: 100% → 0` em `duration.base`.
- Alvos de toque: mínimo 44x44px. O chevron do `IssueCard` não é o alvo,
  o card inteiro é.

---

## 9. Copy: o glossário obrigatório

Sempre o nome humano primeiro, a sigla depois em `mono` menor e cinza.

| Técnico | Na UI |
|---|---|
| LCP | Tempo até o conteúdo principal aparecer |
| CLS | Estabilidade visual (quanto a página "pula" ao carregar) |
| INP | Tempo de resposta ao clique |
| TTFB | Tempo de resposta do servidor |
| Render-blocking resources | Arquivos que atrasam o carregamento |
| Meta description | Resumo que aparece no Google |
| Alt text | Descrição da imagem (pra leitores de tela e pro Google) |
| Viewport meta tag | Configuração que faz o site funcionar no celular |

Regras de copy:

- Segunda pessoa ("seu site"), nunca "o usuário".
- Sem ponto final em título e em label.
- Número sempre com separador brasileiro: `4,2s`, `1.240 ms`.
- Erros dizem o que aconteceu **e** o que fazer. Nunca "Algo deu errado".

---

## 10. Acessibilidade (não negociável)

- Contraste mínimo 4.5:1 em texto, 3:1 em elemento gráfico. `--ink-400` só
  em texto de 12px+ sobre `--bg`, nunca sobre `--bg-muted`.
- Focus visível em **tudo** que recebe foco. Ring de 3px `--accent-ring`, offset 2px.
- Score nunca comunicado só por cor: sempre número + rótulo + ícone.
- Accordion e card expansível com `aria-expanded` e `aria-controls`.
- Progresso da análise em `aria-live="polite"`.
- Ordem de tabulação segue a ordem visual. Nada de `tabindex` positivo.
- Teste com teclado antes de considerar qualquer tela pronta.

---

## 11. Anti-padrões (rejeite no code review)

- Gradiente em fundo de página, em botão ou em texto.
- Glassmorphism fora do header sticky.
- Sombra maior que `--shadow-md`.
- Mais de um acento de cor por tela.
- Emoji no lugar de ícone.
- Animação de entrada em elemento que já estava visível no primeiro paint.
- `scale` em hover de card.
- Ícone sem label em ação primária.
- Skeleton com dimensão diferente do conteúdo final.
- Texto em cinza abaixo de `--ink-500` para conteúdo (só metadados).
- Qualquer `transition: all` em elemento que anima `height` ou `width`
  (use `transform`, senão o frame cai).
- Raio de borda acima de 16px.

---

## 12. Stack de implementação

```
Next.js 15 (App Router) + TypeScript strict
Tailwind CSS v4 (tokens via @theme inline em globals.css)
shadcn/ui (com os tokens desta spec, não os padrão)
motion (motion/react) para animação
lucide-react para ícones, stroke-width 1.75, tamanhos 14/16/18/20/24 apenas
next/font: Inter Variable + Geist Mono
@vercel/og para a imagem de compartilhamento
```

**Organização:**

```
app/
  page.tsx                 # landing
  r/[slug]/page.tsx        # relatório
  r/[slug]/print/page.tsx  # versão de impressão
  api/analyze/route.ts     # stream das etapas
  api/og/route.tsx
components/
  ui/                      # shadcn, tokens sobrescritos
  score-ring.tsx
  url-input.tsx
  issue-card.tsx
  metric-gauge.tsx
  analysis-progress.tsx
lib/
  motion.ts                # durações, easings, variants nomeadas
  score.ts                 # faixa, cor, rótulo e ícone a partir do número
  copy.ts                  # glossário técnico → português
```

`lib/score.ts` e `lib/copy.ts` são fonte única de verdade. Nenhum componente
decide cor de score ou traduz sigla por conta própria.

---

## 13. Checklist de "pronto"

Uma tela só está pronta quando:

- [ ] Os quatro estados da seção 7 existem e foram testados
- [ ] Funciona em 375px de largura sem scroll horizontal
- [ ] Navegação completa por teclado, com focus visível em todo lugar
- [ ] `prefers-reduced-motion` testado no DevTools
- [ ] Nenhum valor de cor, espaço ou raio hardcoded
- [ ] Zero layout shift ao sair do loading (checar no DevTools)
- [ ] Contraste validado em todo texto cinza
- [ ] Nenhum item da seção 11 presente

---

## 14. Decisões de implementação

Registro do que esta spec não definia, ou definia de forma conflitante,
e como foi resolvido. Toda entrada segue os Princípios da seção 1.

### 14.1 Tokens

- **Nomes no Tailwind.** As variáveis continuam como na seção 3.1 (`--bg`, `--bg-subtle`, `--bg-muted`).
  Os utilitários são `bg-surface`, `bg-canvas` e `bg-muted`, para evitar `bg-bg-subtle`.
- **Escalas padrão do Tailwind zeradas.** Cor, tamanho de fonte, raio e sombra só existem se estiverem nesta spec.
  `bg-blue-500`, `text-sm`, `rounded-xl` e `shadow-lg` não compilam.
- **Cor de texto das faixas.** `--good`, `--warn` e `--bad` não chegam a 4,5:1 sobre branco (3,39, 2,77 e 4,20),
  o que contradiz a seção 10. Foram criadas `--good-ink #067A55`, `--warn-ink #9A5800` e `--bad-ink #C4302E`,
  que passam sobre `--bg` e sobre o `-soft`. Regra: **texto usa `-ink`, gráfico usa a cor original.**
- **`--warn` como gráfico (pendente).** Mesmo como gráfico, `--warn` fica em 2,77:1, abaixo dos 3:1 da seção 10.
  Sugestão: `#B47200` (3,93:1). Não aplicado, aguardando decisão.
- **`--ink-400` em texto.** Dá 2,54:1 sobre branco. Ficou restrito a placeholder, ícone decorativo e ao "/100" do anel
  (o número completo está no `aria-label`). Textos que a spec pedia em `--ink-400`, como "Sem cadastro. Sem cartão."
  e a linha de domínios, usam `--ink-500`.
- **`--ink-500` sobre `--bg-muted`** dá 4,43:1. Dentro de bloco `--bg-muted` o texto usa `--ink-700`.
- **Raio do botão.** A seção 3.3 diz 12 e a 6.7 diz 10. Vale a 6.7, com o token `--r-control: 10px`.
  O botão dentro do `UrlInput` usa `--r-sm`, para acompanhar a curva do container (12 menos 8 de margem).
- **Tamanhos citados dentro de componentes** viraram tokens: `text-input` (16), `text-badge` (11),
  `text-stat` (24), `text-stat-lg` (28) e `text-chrome` (11, a URL do mockup).
  Todo tamanho novo precisa ser registrado também em `lib/utils.ts`, senão o merge de classes o descarta.
- **Foco** é feito com `outline` de 3px e offset de 2px, e não com box-shadow. O outline acompanha o raio
  e não briga com as sombras dos componentes.

### 14.2 Movimento

- **Entrada de página** (fadeUp do hero) é feita em CSS, para rodar no primeiro paint sem esperar a hidratação
  (Princípio 7). O `whileInView` continua no motion.
- **Tooltip** usa `scaleIn` em CSS (180ms, `ease.out`), uma aproximação do `spring.snug`.
- **prefers-reduced-motion no JS** só vale depois da hidratação, porque o servidor não conhece a preferência.
  Até lá, o bloco CSS da seção 4.4 segura as animações. Isso evita hydration mismatch.
- **Accordion "Todas as verificações"** mantém o conteúdo no DOM (`forceMount`) para a impressão abrir tudo.
  Na tela, fechar é instantâneo, sem animação de saída.

### 14.3 Componentes

- **ScoreRing.** O número usa 30% do tamanho do anel, e não o token `display`: "100/100" em 64px ocupa uns 170px
  num miolo de 148px. O "/100" some abaixo de 96px, onde ficaria menor que 12px.
  No mobile o anel de 168 é reduzido para 128 com `zoom`.
- **Botão com 40px e alvo de 44px.** Um pseudo-elemento invisível estende a área de toque na vertical.
- **IssueCard.** Gravidade (ícone e borda) e impacto (chip) são dados separados. No mobile o chip desce
  para baixo do título.
- **MetricGauge.** A régua em cores `-soft` quase some sobre o fundo; valor, rótulo e pin carregam a informação.
  O fim da régua foi definido em: tempo até o conteúdo principal 6s, estabilidade visual 0,5,
  tempo de resposta ao clique 1s e tempo de resposta do servidor 3s.
- **Etapas pendentes** da análise usam `--ink-500` em vez de `--ink-400`, pelo contraste. O estado aparece no ícone.
- **Mockup de browser** na proporção 3:4, com o topo da página em `object-top`.

### 14.4 Relatório e dados

- **Nota geral** é a média geométrica ponderada das categorias: performance 40%, as outras 20% cada.
  Uma categoria péssima derruba a nota como elo fraco. Pela média simples, um site com performance 13
  e o resto perfeito ficaria "Precisa de atenção".
- **Teto por arquivos quebrados.** Com 10 ou mais arquivos que não carregam, a nota geral fica em no máximo 49,
  e o relatório explica o motivo.
- **Checagens próprias do Farol:** arquivos que falham ao carregar (a partir das requisições da PSI) e
  pré-visualização do link (`og:image`, `og:title`, `og:description`). Aparecem com o selo "Farol".
- **"Comece por aqui"** mostra os 5 problemas de maior impacto. Os demais ficam atrás de "Ver mais N problemas".
- **Terceira métrica essencial.** O tempo de resposta ao clique só existe com dados de visitantes reais.
  Sem eles, a terceira métrica é o tempo de resposta do servidor, e a seção avisa se o dado é real ou de laboratório.
- **Verificações ARIA** viram uma linha e um card só.
- **Relatórios não são indexados** (`noindex`): são compartilhados por link.
- **Imagem de OG** usa `next/og`, que é o `@vercel/og` empacotado no Next. As cores vêm de `lib/tokens.ts`,
  espelho em hex de `globals.css`.
- **Links do header.** "Como funciona" leva à seção "O que você recebe"; "Ver exemplo" abre o caso de antes e depois (`/casos/gabrielvalenco`). Os relatórios de exemplo avulsos saíram, e `/r/exemplo-*` redireciona para o caso.


### 14.5 Revisão pós-lançamento

- **Tempo limite da análise: 45s** (`ANALYSIS_TIMEOUT_SECONDS`, máximo 50). A PageSpeed pode passar de 100s em sites pesados,
  o que estourava o limite da função (503) e deixava a pessoa sem saída. Com o corte, a mensagem é
  "Esse site demorou demais pra medir". Aos 30s aparece um aviso de que o site está demorando mais que o normal.
  O botão "Cancelar análise" fica visível durante toda a medição. A barra anda em função do tempo limite e nunca para.
- **Promessa da home:** "em menos de 30 segundos" virou "em menos de um minuto", porque as medições reais levam de 30 a 60s.
- **Régua de impacto:** cada problema recebe uma prioridade de 0 a 1 (economia de tempo e bytes, estrago em CLS e TBT,
  peso da verificação × urgência da categoria). "Alto" a partir de 0,6, "Médio" a partir de 0,3,
  com **no máximo 3 "Alto impacto" por relatório**. Antes, os 5 primeiros cards saíam todos como alto.
- **Réguas das métricas:** os trilhos usam `--good-track`, `--warn-track` e `--bad-track` (a cor da faixa a 55% sobre branco),
  e o pin tem recuo de 2% nas pontas, para não colar na borda.
