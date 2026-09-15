"use client";

import { ArrowRight, Share2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ImpactBadge } from "@/components/impact-badge";
import { IssueCard, type Issue } from "@/components/issue-card";
import { MetricGauge } from "@/components/metric-gauge";
import { ScoreRing } from "@/components/score-ring";
import { ScoreStatus } from "@/components/score-status";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UrlInput } from "@/components/url-input";
import { COPY } from "@/lib/copy";

const ISSUES: Issue[] = [
  {
    id: "lcp-image",
    title: "A imagem principal demora a aparecer",
    severity: "bad",
    impact: "high",
    what: "A foto do topo da página pesa 2,4 MB e só aparece depois de 4,2s.",
    why: "Metade dos visitantes no celular desiste antes de 3s. Quem não vê nada, fecha a aba.",
    how: "Converta a imagem para WebP, reduza para 1600px de largura e marque com fetchpriority=\"high\".",
    elements: [
      "img.hero-banner",
      "section#topo > picture > img",
      "div.slider img:nth-child(1)",
      "div.slider img:nth-child(2)",
      "div.slider img:nth-child(3)",
      "div.slider img:nth-child(4)",
      "div.slider img:nth-child(5)",
      "footer img.logo",
    ],
  },
  {
    id: "meta-description",
    title: "Falta o resumo que aparece no Google",
    severity: "warn",
    impact: "medium",
    what: "A página não tem uma descrição, então o Google inventa uma com trechos soltos do texto.",
    why: "Um resumo claro aumenta a chance de a pessoa clicar no seu site e não no concorrente.",
    how: "Adicione uma meta description de 120 a 155 caracteres dizendo o que você vende e onde.",
  },
  {
    id: "alt-text",
    title: "Imagens sem descrição",
    severity: "good",
    impact: "low",
    what: "3 imagens decorativas não têm texto alternativo.",
    why: "Leitores de tela anunciam o nome do arquivo, o que confunde quem depende deles.",
    how: "Use alt=\"\" em imagens puramente decorativas.",
    elements: ["img.divider", "img.bg-pattern", "img.icon-star"],
  },
];

export function Showcase() {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [skeleton, setSkeleton] = useState(true);
  const [ringKey, setRingKey] = useState(0);

  return (
    <main className="container-page flex flex-col gap-20 py-14">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-label font-normal text-ink-500">/dev/components</p>
        <h1 className="text-h1">Componentes base</h1>
        <p className="text-body text-ink-500">
          Todos os estados de cada componente. Teste com teclado (Tab, Enter, Espaço) e com
          prefers-reduced-motion ligado no DevTools.
        </p>
      </header>

      <Section title="Botões" spec="6.7">
        <Row>
          <Button>Analisar</Button>
          <Button variant="secondary">Reanalisar</Button>
          <Button variant="ghost">Como funciona</Button>
          <Button>
            <Share2 size={16} strokeWidth={1.75} aria-hidden />
            Compartilhar
          </Button>
        </Row>
        <Row>
          <Button size="sm">Pequeno</Button>
          <Button size="sm" variant="secondary">
            Pequeno
          </Button>
          <Button variant="secondary" size="icon" aria-label="Próximo">
            <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
          </Button>
          <Button disabled>Desabilitado</Button>
        </Row>
        <Row>
          <Button loading={loading} onClick={() => setLoading((l) => !l)}>
            Compartilhar relatório
          </Button>
          <Button variant="secondary" onClick={() => setLoading((l) => !l)}>
            {loading ? "Parar loading" : "Ligar loading"}
          </Button>
          <Caption>A largura do botão não muda no loading.</Caption>
        </Row>
      </Section>

      <Section title="UrlInput" spec="6.1">
        <UrlInput
          hint={COPY.landing.reassurance}
          loading={loading}
          error={serverError}
          onSubmit={(url, host) => toast.success("URL válida", { description: `${url} (${host})` })}
        />
        <Row>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setServerError((e) => (e ? null : "Não conseguimos acessar esse site. Tente de novo."))
            }
          >
            {serverError ? "Limpar erro do servidor" : "Simular erro do servidor"}
          </Button>
          <Caption>Envie vazio ou &quot;foo&quot; para ver o shake e a mensagem.</Caption>
        </Row>
      </Section>

      <Section title="ScoreRing" spec="6.2">
        <div key={ringKey} className="flex flex-wrap items-center gap-10">
          <ScoreRing value={100} label="Nota geral" />
          <ScoreRing value={87} label="Nota geral" />
          <ScoreRing value={42} label="Nota geral" />
          <ScoreRing value={73} size={128} label="Nota geral" />
          <ScoreRing value={95} size={64} label="Performance" />
          <ScoreRing value={61} size={64} label="SEO" animate={false} />
        </div>
        <Row>
          <Button size="sm" variant="secondary" onClick={() => setRingKey((k) => k + 1)}>
            Reanimar
          </Button>
          <Caption>O último anel de 64px está com animate=false.</Caption>
        </Row>
      </Section>

      <Section title="ScoreStatus e ImpactBadge" spec="3.1 e 6.4">
        <Row>
          <ScoreStatus value={94} />
          <ScoreStatus value={71} />
          <ScoreStatus value={23} />
          <ScoreStatus value={94} size="md" />
          <ScoreStatus value={71} size="md" />
          <ScoreStatus value={23} size="md" />
        </Row>
        <Row>
          <ImpactBadge impact="high" />
          <ImpactBadge impact="medium" />
          <ImpactBadge impact="low" />
          <Badge>Neutro</Badge>
          <Badge variant="accent">Acento</Badge>
          <Badge variant="outline">Contorno</Badge>
        </Row>
      </Section>

      <Section title="IssueCard" spec="6.3">
        <div className="flex flex-col gap-3">
          {ISSUES.map((issue, i) => (
            <IssueCard key={issue.id} issue={issue} emphasized={i === 0} defaultOpen={i === 0} />
          ))}
        </div>
      </Section>

      <Section title="MetricGauge" spec="6.5">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <MetricGauge metric="lcp" value={4200} />
          <MetricGauge metric="cls" value={0.04} />
          <MetricGauge metric="inp" value={620} />
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <MetricGauge metric="ttfb" value={1240} />
          <MetricGauge metric="lcp" value={1800} />
          <MetricGauge metric="inp" value={9000} />
        </div>
      </Section>

      <Section title="Skeleton" spec="6.6">
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {skeleton ? (
              <Skeleton className="h-14 w-full rounded-md" />
            ) : (
              <div className="flex h-14 items-center rounded-md border border-line bg-surface px-4 text-body text-ink-700">
                Conteúdo real, 56px
              </div>
            )}
            {skeleton ? (
              <Skeleton className="size-16 rounded-full" />
            ) : (
              <ScoreRing value={88} size={64} animate={false} />
            )}
          </div>
          <Row>
            <Button size="sm" variant="secondary" onClick={() => setSkeleton((s) => !s)}>
              Alternar skeleton
            </Button>
            <Caption>Nada abaixo deste bloco se move ao alternar.</Caption>
          </Row>
        </div>
      </Section>

      <Section title="Accordion" spec="5.3 item 6">
        <div className="rounded-md border border-line bg-surface px-5">
          <Accordion type="multiple">
            <AccordionItem value="seo">
              <AccordionTrigger>
                <span>
                  SEO, <span className="tnum">11</span> de <span className="tnum">14</span> aprovadas
                </span>
              </AccordionTrigger>
              <AccordionContent>
                Título da página, resumo que aparece no Google, links rastreáveis e mais 8 verificações.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="a11y">
              <AccordionTrigger>
                <span>
                  Acessibilidade, <span className="tnum">18</span> de <span className="tnum">22</span>{" "}
                  aprovadas
                </span>
              </AccordionTrigger>
              <AccordionContent>Contraste, descrição das imagens, rótulos de formulário.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Section>

      <Section title="Input, Tooltip e Toast" spec="6">
        <div className="flex max-w-90 flex-col gap-2">
          <label htmlFor="demo-input" className="text-label text-ink-700">
            Nome do negócio
          </label>
          <Input id="demo-input" placeholder="Padaria do Zé" />
        </div>
        <Row>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary">Passe o mouse ou foque</Button>
            </TooltipTrigger>
            <TooltipContent>Tempo até o conteúdo principal aparecer</TooltipContent>
          </Tooltip>
          <Button variant="secondary" onClick={() => toast.success("Link copiado")}>
            Toast de sucesso
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast.error("Não conseguimos copiar o link", {
                description: "Selecione o endereço na barra do navegador e copie manualmente.",
              })
            }
          >
            Toast de erro
          </Button>
        </Row>
      </Section>
    </main>
  );
}

function Section({ title, spec, children }: { title: string; spec: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
        <h2 className="text-h2">{title}</h2>
        <span className="font-mono text-label font-normal text-ink-500">DESIGN.md {spec}</span>
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

function Caption({ children }: { children: ReactNode }) {
  return <p className="text-body-sm text-ink-500">{children}</p>;
}
