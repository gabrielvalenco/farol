import { Analyzer } from "@/components/analyzer";
import { FeatureGrid } from "@/components/feature-grid";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { COPY } from "@/lib/copy";
import { EXAMPLES } from "@/lib/examples";

/** Landing (DESIGN.md 5.1): uma tela, uma acao. */
export default function Home() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="container-page pt-14 pb-14 sm:pt-[18vh] sm:pb-20">
          {/* 4.3: uma unica fadeUp no bloco principal, em CSS, sem esperar hidratacao. */}
          <div className="flex animate-fade-up flex-col items-center text-center">
            <h1 className="max-w-170 text-h1">{COPY.landing.title}</h1>
            <p className="mt-4 max-w-130 text-body text-ink-500">{COPY.landing.subtitle}</p>

            <div className="mt-8 w-full">
              <Analyzer />
            </div>

            <p className="mt-8 font-mono text-label font-normal text-ink-500">
              <span className="sr-only">Sites já analisados: </span>
              {EXAMPLES.map((example, i) => (
                <span key={example.host}>
                  {i > 0 ? <span aria-hidden> · </span> : null}
                  {example.host}
                </span>
              ))}
            </p>
          </div>
        </section>

        <section id="como-funciona" className="container-page scroll-mt-20 py-14 sm:py-20">
          <div className="mb-10 max-w-180">
            <p className="text-label text-ink-500">Como funciona</p>
            <h2 className="mt-2 text-h2">O que você recebe</h2>
            <p className="mt-3 text-body text-ink-500">
              A gente mede o seu site com a mesma ferramenta que o Google usa, soma checagens próprias e traduz tudo
              pra português, com uma nota de 0 a 100 e a lista do que arrumar primeiro.
            </p>
          </div>
          <FeatureGrid />
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
