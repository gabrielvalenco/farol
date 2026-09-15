/**
 * Traducao das verificacoes do Lighthouse para portugues de gente
 * (DESIGN.md 1.5 e 9). Fonte unica: nenhum componente reescreve titulo
 * de auditoria por conta propria.
 *
 * - `label`: nome neutro, usado na lista "Todas as verificacoes".
 * - `title`: o problema, usado no card de "Comece por aqui".
 * - `what` / `why` / `how`: os tres blocos do IssueCard (6.3).
 *
 * Verificacao sem entrada aqui cai no texto pt_BR da propria PSI, limpo de
 * markdown. Vale adicionar entrada sempre que um relatorio real mostrar
 * texto tecnico demais.
 */

import type { Impact } from "@/lib/score";

export interface AuditContext {
  /** Quantidade de itens afetados. */
  count: number;
  /** Valor ja formatado pela PSI em pt_BR ("Economia estimada de 1.554 KiB"). */
  display?: string;
  /** Valor bruto da auditoria (ms, bytes ou indice). */
  numericValue?: number;
}

type Text = string | ((ctx: AuditContext) => string);

export interface AuditCopy {
  label: string;
  title: string;
  what: Text;
  why: string;
  how: string;
  /** Impacto fixo, quando a heuristica generica erraria. */
  impact?: Impact;
}

const items = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** "1.554 KiB" -> "1,6 MB"; "1.730 ms" -> "1,7s". Sem unidade tecnica na UI (DESIGN.md 9). */
export function humanizeUnits(value: string): string {
  const toNumber = (raw: string) => Number(raw.replace(/\./g, "").replace(",", "."));
  return value
    .replace(/([\d.,]+)\s*KiB/g, (_, n: string) => {
      const kb = toNumber(n) * 1.024;
      return kb >= 1000 ? `${decimal.format(kb / 1000)} MB` : `${Math.round(kb)} KB`;
    })
    .replace(/([\d.,]+)\s*ms\b/g, (_, n: string) => {
      const ms = toNumber(n);
      return ms >= 1000 ? `${decimal.format(ms / 1000)}s` : `${Math.round(ms)} ms`;
    })
    .replace(/(\d),(\d)\s+s\b/g, "$1,$2s");
}

const savings = (ctx: AuditContext) =>
  ctx.display ? ` ${humanizeUnits(ctx.display).replace(/^Economia estimada de/i, "Dá pra economizar")}.` : "";

/** Valor da PSI sem unidade tecnica, com fallback. */
const shown = (ctx: AuditContext, fallback: string) => (ctx.display ? humanizeUnits(ctx.display) : fallback);

export const AUDIT_COPY: Record<string, AuditCopy> = {
  /* ---------------- Performance: metricas ---------------- */
  "first-contentful-paint": {
    label: "Tempo até aparecer a primeira coisa na tela",
    title: "A tela fica em branco por muito tempo",
    what: (c) => `O primeiro texto ou imagem só aparece em ${shown(c, "muito tempo")}.`,
    why: "Tela em branco parece site quebrado. Muita gente fecha antes de ver qualquer coisa.",
    how: "Tire da frente do carregamento o que não é essencial: fontes extras, scripts de terceiros e CSS que não é usado no topo da página.",
  },
  "largest-contentful-paint": {
    label: "Tempo até o conteúdo principal aparecer",
    title: "O conteúdo principal demora a aparecer",
    what: (c) => `A parte mais importante do topo da página só aparece em ${shown(c, "muito tempo")}.`,
    why: "Metade dos visitantes no celular desiste quando a página passa de 3 segundos.",
    how: "Deixe a imagem ou o bloco principal do topo leve e carregando primeiro: imagem comprimida em WebP, sem fontes e scripts na frente.",
  },
  "total-blocking-time": {
    label: "Tempo em que a página fica travada",
    title: "A página trava enquanto carrega",
    what: (c) => `Durante ${shown(c, "um bom tempo")} a página não responde a toques e cliques.`,
    why: "A pessoa toca no botão e nada acontece. A sensação é de site lento ou quebrado.",
    how: "Reduza o JavaScript: remova bibliotecas que não usa, adie scripts de terceiros e carregue efeitos pesados só depois que a página abriu.",
  },
  "cumulative-layout-shift": {
    label: "Estabilidade visual (quanto a página “pula” ao carregar)",
    title: "A página pula enquanto carrega",
    what: (c) => `Os elementos mudam de lugar durante o carregamento (índice ${c.display ?? "alto"}, o bom é até 0,1).`,
    why: "A pessoa vai tocar num botão e acaba tocando em outro. Irrita e gera clique errado.",
    how: "Reserve o espaço de imagens, vídeos, banners e textos animados antes de eles carregarem, com largura e altura definidas.",
  },
  "speed-index": {
    label: "Velocidade com que a página vai se desenhando",
    title: "A página demora a se montar na tela",
    what: (c) => `A página leva ${shown(c, "muito tempo")} pra ficar visualmente pronta.`,
    why: "Quanto mais tempo a tela fica incompleta, maior a chance de a pessoa desistir.",
    how: "Priorize o que aparece no topo e adie o resto: imagens de baixo, vídeos e scripts de terceiros.",
  },

  /* ---------------- Performance: causas ---------------- */
  "render-blocking-insight": {
    label: "Arquivos que atrasam o carregamento",
    title: "Arquivos atrasam o carregamento",
    what: (c) => `${items(c.count, "arquivo precisa", "arquivos precisam")} carregar antes de qualquer coisa aparecer na tela.${savings(c)}`,
    why: "Enquanto esses arquivos não chegam, a tela fica em branco.",
    how: "Carregue fontes com display=swap, adie scripts com defer e remova CSS ou bibliotecas que a primeira tela não usa.",
  },
  "image-delivery-insight": {
    label: "Tamanho das imagens",
    title: "Imagens pesadas demais",
    what: (c) =>
      `${items(c.count, "imagem está maior do que precisa", "imagens estão maiores do que precisam")}.${savings(c)}`,
    why: "Imagem pesada é o motivo mais comum de site lento no celular, e ainda gasta o plano de dados de quem visita.",
    how: "Converta para WebP ou AVIF, reduza para o tamanho que realmente aparece na tela e use loading=\"lazy\" nas imagens abaixo do topo.",
  },
  "unused-javascript": {
    label: "JavaScript que não é usado",
    title: "Tem JavaScript sobrando",
    what: (c) => `${items(c.count, "arquivo de JavaScript tem", "arquivos de JavaScript têm")} muito código que a página não usa.${savings(c)}`,
    why: "Todo código baixado precisa ser processado pelo celular, mesmo sem uso. Isso deixa a página lenta e travada.",
    how: "Remova bibliotecas e scripts que não usa, divida o código por página e carregue ferramentas de terceiros só depois da página abrir.",
  },
  "unused-css-rules": {
    label: "CSS que não é usado",
    title: "Tem CSS sobrando",
    what: (c) => `${items(c.count, "arquivo de estilo tem", "arquivos de estilo têm")} regras que a página não usa.${savings(c)}`,
    why: "O navegador baixa e lê tudo antes de mostrar a página.",
    how: "Remova frameworks ou versões duplicadas que não usa (ex.: dois Font Awesome) e gere só o CSS das classes usadas.",
  },
  "font-display-insight": {
    label: "Fontes aparecem sem esperar",
    title: "Texto invisível enquanto a fonte carrega",
    what: (c) => `${items(c.count, "fonte esconde", "fontes escondem")} o texto até terminar de baixar.${savings(c)}`,
    why: "A pessoa vê espaço vazio onde deveria ter texto.",
    how: "Adicione font-display: swap nas fontes (no Google Fonts, &display=swap no endereço).",
  },
  "cache-insight": {
    label: "Arquivos guardados no navegador",
    title: "O navegador baixa tudo de novo a cada visita",
    what: (c) => `${items(c.count, "arquivo não fica", "arquivos não ficam")} guardados no navegador de quem volta.${savings(c)}`,
    why: "Quem volta ao site espera tudo carregar de novo, sem necessidade.",
    how: "Configure cabeçalhos de cache longos (Cache-Control) para imagens, fontes, CSS e JavaScript.",
  },
  redirects: {
    label: "Redirecionamentos",
    title: "O site redireciona antes de abrir",
    what: (c) => `O endereço passa por ${items(Math.max(c.count - 1, 1), "redirecionamento", "redirecionamentos")} antes da página de verdade.${savings(c)}`,
    why: "Cada redirecionamento é mais uma espera antes de qualquer coisa aparecer.",
    how: "Faça o endereço principal abrir direto a página final, sem passar por outras URLs no caminho.",
  },
  "document-latency-insight": {
    label: "Tempo de resposta do servidor",
    title: "O servidor demora a responder",
    what: (c) => `A primeira resposta do servidor está lenta ou sem compressão.${savings(c)}`,
    why: "Nada acontece na tela enquanto o servidor não responde.",
    how: "Ative compressão (gzip ou brotli), cache de página e evite redirecionamentos na página inicial.",
  },
  "server-response-time": {
    label: "Tempo de resposta do servidor",
    title: "O servidor demora a responder",
    what: (c) => `O servidor levou ${shown(c, "muito tempo")} pra começar a responder.`,
    why: "Nada acontece na tela enquanto o servidor não responde.",
    how: "Use cache de página, uma hospedagem mais próxima do Brasil ou uma CDN.",
  },
  "cls-culprits-insight": {
    label: "Causas da página pular",
    title: "Elementos que fazem a página pular",
    what: (c) => `${items(c.count, "elemento muda", "elementos mudam")} de lugar durante o carregamento.`,
    why: "A pessoa vai tocar num botão e acaba tocando em outro.",
    how: "Defina largura e altura de imagens e vídeos, reserve espaço para banners e evite textos animados que mudam de tamanho no topo.",
  },
  "forced-reflow-insight": {
    label: "Scripts que forçam o navegador a recalcular a página",
    title: "Scripts fazem o navegador recalcular a página",
    what: "Alguns scripts leem e alteram o tamanho dos elementos em sequência, forçando o navegador a refazer o layout várias vezes.",
    why: "Isso trava a página e deixa rolagem e animações engasgando.",
    how: "Agrupe leituras e escritas de layout, e prefira animar transform e opacity em vez de tamanho e posição.",
    impact: "low",
  },
  "legacy-javascript-insight": {
    label: "JavaScript antigo desnecessário",
    title: "JavaScript feito para navegadores antigos",
    what: (c) => `Parte do código ainda é convertida para navegadores que quase ninguém usa mais.${savings(c)}`,
    why: "É peso extra baixado por todo mundo.",
    how: "Atualize a configuração de build para navegadores modernos.",
  },
  "duplicated-javascript-insight": {
    label: "JavaScript duplicado",
    title: "O mesmo JavaScript é baixado mais de uma vez",
    what: (c) => `Há bibliotecas repetidas entre os arquivos.${savings(c)}`,
    why: "É peso baixado duas vezes sem nenhum ganho.",
    how: "Remova as cópias e carregue cada biblioteca uma vez só.",
  },
  "dom-size-insight": {
    label: "Tamanho da estrutura da página",
    title: "A página tem elementos demais",
    what: (c) => `A página tem uma estrutura muito grande${c.display ? ` (${c.display})` : ""}.`,
    why: "Página muito grande deixa o celular lento pra desenhar e responder.",
    how: "Mostre menos itens de uma vez (paginação ou carregar mais) e simplifique a estrutura dos blocos repetidos.",
  },
  "total-byte-weight": {
    label: "Peso total da página",
    title: "A página pesa demais",
    what: (c) =>
      c.numericValue
        ? `A página baixa ${decimal.format(c.numericValue / 1_000_000)} MB no total. O ideal é ficar abaixo de 1,6 MB.`
        : "A página baixa arquivos demais.",
    why: "No 4G isso significa espera longa e plano de dados gasto.",
    how: "Comece pelos maiores arquivos: vídeos, imagens grandes e bibliotecas pesadas.",
  },
  "bootup-time": {
    label: "Tempo processando JavaScript",
    title: "O celular gasta muito tempo processando JavaScript",
    what: (c) => `O processamento de scripts levou ${shown(c, "muito tempo")}.`,
    why: "Enquanto processa, a página não responde.",
    how: "Remova scripts que não usa e adie os de terceiros (chat, pixels, analytics).",
  },
  "unminified-css": {
    label: "CSS compactado",
    title: "CSS sem compactar",
    what: (c) => `Os arquivos de estilo estão com espaços e comentários sobrando.${savings(c)}`,
    why: "É peso baixado sem necessidade.",
    how: "Ative a minificação de CSS no build ou no plugin de cache do site.",
    impact: "low",
  },
  "unminified-javascript": {
    label: "JavaScript compactado",
    title: "JavaScript sem compactar",
    what: (c) => `Os scripts estão com espaços e comentários sobrando.${savings(c)}`,
    why: "É peso baixado sem necessidade.",
    how: "Ative a minificação de JavaScript no build ou no plugin de cache do site.",
    impact: "low",
  },
  "unsized-images": {
    label: "Imagens com tamanho definido",
    title: "Imagens sem tamanho definido",
    what: (c) => `${items(c.count, "imagem não tem", "imagens não têm")} largura e altura definidas.`,
    why: "Sem tamanho, a página pula quando a imagem termina de carregar.",
    how: "Coloque width e height em toda imagem.",
  },
  "lcp-discovery-insight": {
    label: "Imagem principal encontrada cedo",
    title: "A imagem principal é descoberta tarde",
    what: "O navegador só descobre a imagem mais importante do topo depois de carregar outros arquivos.",
    why: "O conteúdo principal demora mais a aparecer.",
    how: "Coloque a imagem principal direto no HTML, sem loading=\"lazy\", e com fetchpriority=\"high\".",
  },
  "modern-http-insight": {
    label: "Protocolo moderno (HTTP/2)",
    title: "O servidor usa um protocolo antigo",
    what: "Os arquivos são entregues por HTTP/1.1, que baixa um arquivo de cada vez.",
    why: "Com muitos arquivos, a página demora mais a carregar.",
    how: "Ative HTTP/2 ou HTTP/3 na hospedagem ou use uma CDN.",
  },
  "viewport-insight": {
    label: "Configuração que faz o site funcionar no celular",
    title: "O site não está configurado pro celular",
    what: "Falta a configuração de tela para dispositivos móveis (viewport).",
    why: "O site aparece miniaturizado e os toques demoram a responder.",
    how: "Adicione <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> no <head>.",
    impact: "high",
  },
  "bf-cache": {
    label: "Voltar e avançar instantâneo",
    title: "Voltar pra página recarrega tudo",
    what: "A página impede o navegador de guardá-la ao usar o botão voltar.",
    why: "Quem volta pra página espera tudo carregar de novo.",
    how: "Evite o evento unload e cabeçalhos Cache-Control: no-store na página.",
    impact: "low",
  },

  /* ---------------- Acessibilidade ---------------- */
  "color-contrast": {
    label: "Contraste do texto",
    title: "Texto difícil de ler",
    what: (c) => `${items(c.count, "texto tem", "textos têm")} pouco contraste com o fundo.`,
    why: "Texto claro demais some no sol, em tela de celular barata e pra quem enxerga pouco.",
    how: "Escureça o texto ou o fundo até chegar em contraste de 4,5:1. Botão com texto branco precisa de fundo escuro o bastante.",
  },
  "image-alt": {
    label: "Descrição da imagem (pra leitores de tela e pro Google)",
    title: "Imagens sem descrição",
    what: (c) => `${items(c.count, "imagem não tem", "imagens não têm")} descrição.`,
    why: "Quem usa leitor de tela não sabe o que a imagem mostra, e o Google também não.",
    how: "Adicione alt descrevendo a imagem. Em imagem só decorativa, use alt=\"\".",
  },
  "button-name": {
    label: "Botões com nome",
    title: "Botões sem nome",
    what: (c) => `${items(c.count, "botão não tem", "botões não têm")} nome que um leitor de tela consiga anunciar.`,
    why: "Quem usa leitor de tela ouve só \"botão\", sem saber o que ele faz.",
    how: "Coloque texto no botão ou um aria-label dizendo a ação.",
  },
  "link-name": {
    label: "Links com nome",
    title: "Links sem nome",
    what: (c) => `${items(c.count, "link não tem", "links não têm")} texto que diga pra onde levam.`,
    why: "Quem usa leitor de tela não sabe pra onde o link vai.",
    how: "Coloque texto no link ou um aria-label. Em link só com ícone, descreva o destino.",
  },
  label: {
    label: "Campos de formulário com rótulo",
    title: "Campos de formulário sem rótulo",
    what: (c) => `${items(c.count, "campo não tem", "campos não têm")} rótulo associado.`,
    why: "Quem usa leitor de tela não sabe o que digitar, e o navegador não preenche automático.",
    how: "Use <label for> ligado ao campo, ou aria-label quando não houver texto visível.",
  },
  "html-has-lang": {
    label: "Idioma da página definido",
    title: "A página não diz em que idioma está",
    what: "Falta o atributo lang na página.",
    why: "O leitor de tela pode ler o português com sotaque de outro idioma, e o tradutor automático se confunde.",
    how: "Use <html lang=\"pt-BR\">.",
  },
  "html-lang-valid": {
    label: "Idioma da página válido",
    title: "O idioma da página está errado",
    what: "O código de idioma da página não é válido.",
    why: "O leitor de tela pode ler com a pronúncia errada.",
    how: "Use <html lang=\"pt-BR\">.",
  },
  "document-title": {
    label: "Título da página",
    title: "A página não tem título",
    what: "Falta o título que aparece na aba do navegador e no Google.",
    why: "Sem título, o Google inventa um e a aba fica sem nome.",
    how: "Adicione um <title> com o nome do negócio e o que ele oferece.",
    impact: "high",
  },
  "heading-order": {
    label: "Ordem dos títulos",
    title: "Títulos fora de ordem",
    what: "Os títulos da página pulam níveis (ex.: de h1 direto pra h4).",
    why: "Quem navega por leitor de tela usa os títulos como índice da página.",
    how: "Use h1, h2, h3 em sequência, sem pular níveis.",
  },
  "meta-viewport": {
    label: "Zoom permitido no celular",
    title: "O site bloqueia o zoom no celular",
    what: "A configuração da página impede a pessoa de dar zoom.",
    why: "Quem enxerga pouco precisa aumentar o texto pra conseguir ler.",
    how: "Remova user-scalable=no e maximum-scale da meta viewport.",
  },
  "target-size": {
    label: "Tamanho das áreas de toque",
    title: "Botões pequenos demais pro dedo",
    what: (c) => `${items(c.count, "área de toque é", "áreas de toque são")} pequenas ou coladas demais.`,
    why: "A pessoa erra o toque e abre a coisa errada.",
    how: "Deixe botões e links com pelo menos 24px (ideal 44px) e espaço entre eles.",
  },
  tabindex: {
    label: "Ordem de navegação pelo teclado",
    title: "A ordem do teclado está bagunçada",
    what: "Alguns elementos forçam uma ordem de navegação diferente da visual.",
    why: "Quem navega por teclado pula de um lado pro outro da página.",
    how: "Remova tabindex com valor maior que 0.",
  },
  "landmark-one-main": {
    label: "Região principal marcada",
    title: "A página não marca o conteúdo principal",
    what: "Falta o elemento <main> na página.",
    why: "Quem usa leitor de tela não consegue pular direto pro conteúdo.",
    how: "Envolva o conteúdo principal em <main>.",
    impact: "low",
  },

  /* ---------------- Boas praticas ---------------- */
  "is-on-https": {
    label: "Conexão segura (HTTPS)",
    title: "O site não é seguro",
    what: "A página ou parte dos arquivos é carregada sem HTTPS.",
    why: "O navegador mostra \"Não seguro\" e muita gente vai embora na hora.",
    how: "Ative o certificado SSL na hospedagem (a maioria oferece de graça) e redirecione tudo pra https.",
    impact: "high",
  },
  deprecations: {
    label: "Recursos obsoletos do navegador",
    title: "O site usa recursos que vão deixar de funcionar",
    what: (c) => `${items(c.count, "recurso obsoleto foi usado", "recursos obsoletos foram usados")}.`,
    why: "Numa atualização do navegador, essa parte do site pode simplesmente parar.",
    how: "Atualize as bibliotecas e plugins listados.",
  },
  "third-party-cookies": {
    label: "Cookies de terceiros",
    title: "O site depende de cookies de terceiros",
    what: (c) => `${items(c.count, "cookie de terceiro foi encontrado", "cookies de terceiros foram encontrados")}.`,
    why: "Os navegadores estão bloqueando esses cookies, então rastreamento e anúncios podem parar de funcionar.",
    how: "Confira se as ferramentas de anúncio e análise estão atualizadas e configuradas no seu próprio domínio.",
    impact: "low",
  },
  "errors-in-console": {
    label: "Erros no navegador",
    title: "O navegador registra erros na página",
    what: (c) => `${items(c.count, "erro apareceu", "erros apareceram")} no console do navegador.`,
    why: "Erro costuma significar algo que não funcionou: imagem, formulário ou script quebrado.",
    how: "Abra o site com as ferramentas de desenvolvedor (F12), aba Console, e corrija os erros da lista.",
  },
  "image-aspect-ratio": {
    label: "Proporção das imagens",
    title: "Imagens esticadas ou achatadas",
    what: (c) => `${items(c.count, "imagem aparece", "imagens aparecem")} com a proporção errada.`,
    why: "Imagem distorcida passa descuido.",
    how: "Use object-fit: cover ou ajuste largura e altura pra respeitar a proporção original.",
  },
  "image-size-responsive": {
    label: "Resolução das imagens",
    title: "Imagens borradas",
    what: (c) => `${items(c.count, "imagem tem", "imagens têm")} resolução baixa pro tamanho em que aparecem.`,
    why: "Imagem borrada passa descuido, principalmente em produto e foto de imóvel.",
    how: "Use imagens com o dobro do tamanho em que aparecem, com srcset.",
  },
  "paste-preventing-inputs": {
    label: "Colar em campos de formulário",
    title: "O formulário não deixa colar",
    what: "Algum campo bloqueia colar texto.",
    why: "Atrapalha quem usa gerenciador de senha ou copia o e-mail.",
    how: "Remova o bloqueio de colar dos campos.",
  },
  doctype: {
    label: "Tipo de documento declarado",
    title: "A página não declara o tipo de documento",
    what: "Falta <!DOCTYPE html> no começo da página.",
    why: "O navegador pode desenhar a página no modo antigo e quebrar o layout.",
    how: "Coloque <!DOCTYPE html> na primeira linha.",
  },
  charset: {
    label: "Codificação de caracteres",
    title: "Acentos podem aparecer quebrados",
    what: "A codificação de caracteres não está declarada corretamente.",
    why: "Acentos e cedilha podem aparecer como símbolos estranhos.",
    how: "Adicione <meta charset=\"utf-8\"> no começo do <head>.",
  },
  "geolocation-on-start": {
    label: "Pedido de localização ao abrir",
    title: "O site pede localização assim que abre",
    what: "A página pede permissão de localização sem a pessoa ter feito nada.",
    why: "Pedido sem contexto assusta e costuma ser negado.",
    how: "Só peça a localização quando a pessoa tocar num botão que precise dela.",
  },
  "notification-on-start": {
    label: "Pedido de notificação ao abrir",
    title: "O site pede notificação assim que abre",
    what: "A página pede permissão de notificação sem a pessoa ter feito nada.",
    why: "Pedido sem contexto irrita e costuma ser negado.",
    how: "Só peça notificação depois que a pessoa demonstrar interesse.",
  },

  /* ---------------- SEO ---------------- */
  "meta-description": {
    label: "Resumo que aparece no Google",
    title: "Falta o resumo que aparece no Google",
    what: "A página não tem descrição, então o Google monta uma com trechos soltos do texto.",
    why: "Um resumo claro aumenta a chance de a pessoa clicar no seu site e não no do concorrente.",
    how: "Adicione <meta name=\"description\"> com 120 a 155 caracteres dizendo o que você oferece e onde.",
    impact: "medium",
  },
  "is-crawlable": {
    label: "Página liberada pro Google",
    title: "O Google está proibido de mostrar esta página",
    what: "A página está marcada para não aparecer em buscadores.",
    why: "Ninguém encontra o site pelo Google.",
    how: "Remova noindex da meta robots ou do cabeçalho X-Robots-Tag, e confira o robots.txt.",
    impact: "high",
  },
  "http-status-code": {
    label: "Página responde sem erro",
    title: "A página responde com erro",
    what: "O servidor devolve um código de erro para esta página.",
    why: "O Google não indexa páginas com erro.",
    how: "Confira a configuração do servidor pra página responder com status 200.",
    impact: "high",
  },
  "link-text": {
    label: "Texto dos links",
    title: "Links com texto genérico",
    what: (c) => `${items(c.count, "link usa", "links usam")} textos como "clique aqui" ou "saiba mais".`,
    why: "O Google e quem usa leitor de tela não entendem pra onde o link leva.",
    how: "Escreva o destino no texto do link, ex.: \"Ver imóveis em Birigui\".",
  },
  "crawlable-anchors": {
    label: "Links que o Google consegue seguir",
    title: "Links que o Google não consegue seguir",
    what: (c) => `${items(c.count, "link não tem", "links não têm")} um endereço de verdade.`,
    why: "O Google não descobre as outras páginas do site.",
    how: "Use <a href=\"/pagina\"> em vez de links feitos só com JavaScript.",
  },
  "robots-txt": {
    label: "Arquivo robots.txt",
    title: "O robots.txt tem erro",
    what: "O arquivo que orienta os buscadores tem problemas.",
    why: "Buscadores podem ignorar ou bloquear partes do site.",
    how: "Corrija o /robots.txt conforme os erros listados.",
  },
  hreflang: {
    label: "Idiomas alternativos",
    title: "Configuração de idiomas inválida",
    what: "As indicações de versões em outros idiomas estão erradas.",
    why: "O Google pode mostrar a versão errada pra quem busca.",
    how: "Revise os links hreflang ou remova se o site é só em português.",
    impact: "low",
  },
};

/** Marcacoes ARIA: um texto so para a familia inteira. */
export const ARIA_COPY: AuditCopy = {
  label: "Marcações de acessibilidade (ARIA) corretas",
  title: "Marcações de acessibilidade com erro",
  what: (c) => `${items(c.count, "elemento usa", "elementos usam")} atributos de acessibilidade (ARIA) de forma inválida.`,
  why: "O leitor de tela anuncia informação errada ou deixa de anunciar partes da página.",
  how: "Corrija os atributos aria-* e role listados conforme a especificação.",
};

/** Nome neutro de verificacoes que nunca viram card, so aparecem na lista. */
export const CHECK_LABELS: Record<string, string> = {
  "mainthread-work-breakdown": "Trabalho do celular pra montar a página",
  "inspector-issues": "Avisos técnicos do navegador",
  "valid-source-maps": "Mapas de código para depuração",
  list: "Listas marcadas corretamente",
  listitem: "Itens de lista marcados corretamente",
  "autocomplete-valid": "Preenchimento automático dos formulários",
  "link-in-text-block": "Links que se destacam do texto sem depender da cor",
  "max-potential-fid": "Pior atraso possível ao primeiro toque",
  interactive: "Tempo até a página ficar usável",
};

/** Diagnosticos que nao sao aprovado/reprovado: ficam fora da lista inteira. */
export const NOT_A_CHECK = new Set(["network-dependency-tree-insight", "lcp-breakdown-insight", "third-parties-insight"]);

/**
 * Verificacoes que nao viram card de problema: sao diagnostico interno,
 * duplicam outra verificacao ou so interessam a quem desenvolve.
 */
export const NOT_AN_ISSUE = new Set([
  "network-dependency-tree-insight",
  "lcp-breakdown-insight",
  "mainthread-work-breakdown",
  "max-potential-fid",
  "interactive",
  "layout-shifts",
  "valid-source-maps",
  "inspector-issues",
  "non-composited-animations",
  "long-tasks",
  "third-parties-insight",
  // As metricas aparecem nos Core Web Vitals; o card mostra as causas.
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
]);

/** Chave de agrupamento: as ~15 verificacoes ARIA viram uma linha e um card. */
export function groupKey(id: string): string {
  return id.startsWith("aria-") ? "aria" : id;
}

export function copyFor(id: string): AuditCopy | null {
  if (AUDIT_COPY[id]) return AUDIT_COPY[id];
  if (id.startsWith("aria-")) return ARIA_COPY;
  return null;
}

export function resolveText(text: Text, ctx: AuditContext): string {
  return typeof text === "function" ? text(ctx) : text;
}

/** Limpa markdown da descricao da PSI ("[Saiba mais](...)", crases). */
export function cleanLighthouseText(value: string | undefined): string {
  if (!value) return "";
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`/g, "")
    .replace(/\s*(Saiba mais|Learn more)[^.]*\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
