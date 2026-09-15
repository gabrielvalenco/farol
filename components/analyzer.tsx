"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AnalysisError, type AnalysisFailure } from "@/components/analysis-error";
import { AnalysisProgress, type StepStatus } from "@/components/analysis-progress";
import { UrlInput } from "@/components/url-input";
import type { AnalysisErrorCode } from "@/lib/analysis/errors";
import { readEvents, type AnalysisErrorBody, type AnalysisEvent } from "@/lib/analysis/events";
import { ANALYSIS_STEPS, COPY, type StepKey } from "@/lib/copy";
import { normalizeUrl } from "@/lib/url";
import { useMotion } from "@/lib/use-motion";

const STEP_KEYS = ANALYSIS_STEPS.map((s) => s.key);

/** Fatia da barra de cada etapa: [inicio, tamanho]. A PSI e o grosso do tempo. */
const SLICES: Record<StepKey, [number, number]> = {
  fetch: [0, 0.1],
  performance: [0.1, 0.6],
  seo: [0.7, 0.1],
  accessibility: [0.8, 0.1],
  report: [0.9, 0.1],
};

/** Etapas que o servidor conclui em milissegundos ainda ficam legiveis. */
const MIN_ACTIVE_MS = 450;
/** Tempo pra pessoa ver o proprio site no mockup antes de ir pro relatorio. */
const SCREENSHOT_HOLD_MS = 900;

type Phase = { kind: "idle" } | { kind: "running" } | { kind: "error"; failure: AnalysisFailure } | { kind: "done" };

const pendingSteps = (): Record<StepKey, StepStatus> =>
  Object.fromEntries(STEP_KEYS.map((k) => [k, "pending"])) as Record<StepKey, StepStatus>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

/**
 * Campo de URL + estado de analise (DESIGN.md 5.1 e 5.2).
 * O campo nao some: o bloco cresce abaixo dele com as etapas reais do stream.
 */
export function Analyzer() {
  const router = useRouter();
  const { reduced, v } = useMotion();

  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [target, setTarget] = useState<{ url: string; host: string } | null>(null);
  const [steps, setSteps] = useState(pendingSteps);
  const [favicon, setFavicon] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [input, setInput] = useState({ key: 0, value: "" });

  const runId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const activeSince = useRef<Partial<Record<StepKey, number>>>({});
  const stepsRef = useRef(steps);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  // A barra nunca trava: dentro da etapa ativa avanca devagar ate 90% da fatia.
  useEffect(() => {
    if (phase.kind !== "running") return;
    const timer = setInterval(() => {
      const activeKey = STEP_KEYS.find((k) => stepsRef.current[k] === "active");
      if (!activeKey) return;
      const [start, size] = SLICES[activeKey];
      const elapsed = Date.now() - (activeSince.current[activeKey] ?? Date.now());
      const fraction = 0.9 * (1 - Math.exp(-elapsed / 6000));
      setProgress((p) => Math.max(p, start + size * fraction));
    }, 250);
    return () => clearInterval(timer);
  }, [phase.kind]);

  const run = useCallback(
    async (url: string, host: string, force = false) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const id = ++runId.current;
      const alive = () => runId.current === id;

      activeSince.current = {};
      setTarget({ url, host });
      setSteps(pendingSteps());
      setFavicon(null);
      setScreenshot(null);
      setProgress(0);
      setPhase({ kind: "running" });

      const fail = (failure: AnalysisFailure) => {
        if (alive()) setPhase({ kind: "error", failure });
      };

      let response: Response;
      try {
        response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url, force }),
          signal: controller.signal,
        });
      } catch {
        if (!controller.signal.aborted) fail({ code: "internal" });
        return;
      }

      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as AnalysisErrorBody | null;
        fail(body ?? { code: "internal" });
        return;
      }

      let screenshotAt = 0;
      let finished = false;
      let chain = Promise.resolve();

      const apply = async (event: AnalysisEvent) => {
        if (!alive()) return;

        switch (event.type) {
          case "step": {
            const [start, size] = SLICES[event.key];
            if (event.status === "active") {
              activeSince.current[event.key] = Date.now();
              setSteps((s) => ({ ...s, [event.key]: "active" }));
              setProgress((p) => Math.max(p, start));
            } else {
              const since = activeSince.current[event.key] ?? Date.now();
              await sleep(MIN_ACTIVE_MS - (Date.now() - since));
              if (!alive()) return;
              setSteps((s) => ({ ...s, [event.key]: "done" }));
              setProgress((p) => Math.max(p, start + size));
            }
            break;
          }
          case "site":
            setFavicon(event.favicon);
            break;
          case "screenshot":
            screenshotAt = Date.now();
            setScreenshot(event.data);
            break;
          case "done": {
            finished = true;
            if (!event.cached) {
              await sleep(screenshotAt ? SCREENSHOT_HOLD_MS - (Date.now() - screenshotAt) : 0);
            }
            if (!alive()) return;
            setProgress(1);
            setPhase({ kind: "done" });
            router.push(`/r/${event.slug}`);
            break;
          }
          case "error":
            finished = true;
            fail({ code: event.code, retryAfter: event.retryAfter });
            break;
          case "partial":
            break;
        }
      };

      try {
        await readEvents(response.body, (event) => {
          chain = chain.then(() => apply(event));
        });
        await chain;
      } catch {
        if (!controller.signal.aborted) fail({ code: "internal" });
        return;
      }

      if (!finished) fail({ code: "internal" });
    },
    [router],
  );

  // "Reanalisar" chega como /?url=...&force=1: preenche o campo e ja comeca.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("url");
    if (!requested) return;
    const normalized = normalizeUrl(requested);
    window.history.replaceState(null, "", window.location.pathname);
    if (!normalized.ok) return;
    setInput((i) => ({ key: i.key + 1, value: requested }));
    void run(normalized.url, normalized.host, params.get("force") === "1");
  }, [run]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const busy = phase.kind === "running" || phase.kind === "done";

  useEffect(() => {
    if (phase.kind === "running" || phase.kind === "error") {
      panelRef.current?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
    }
  }, [phase.kind, reduced]);

  const retry = () => {
    if (!target) return;
    const code: AnalysisErrorCode | undefined = phase.kind === "error" ? phase.failure.code : undefined;
    if (code === "invalid_url" || code === "blocked_url") {
      setPhase({ kind: "idle" });
      document.querySelector<HTMLInputElement>("form input[name=url]")?.focus();
      return;
    }
    void run(target.url, target.host, false);
  };

  return (
    <div className="mx-auto flex w-full max-w-220 flex-col items-center">
      <UrlInput
        key={input.key}
        defaultValue={input.value}
        loading={busy}
        hint={COPY.landing.reassurance}
        onSubmit={(url, host) => void run(url, host)}
        className="mx-auto"
      />

      <div ref={panelRef} className="w-full scroll-mb-6 text-left">
        <AnimatePresence initial={false} mode="wait">
          {busy && target ? (
            <motion.div
              key="progress"
              variants={v.collapse}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="overflow-hidden"
            >
              <div className="pt-4">
                <AnalysisProgress state={{ steps, progress, host: target.host, favicon, screenshot }} />
              </div>
            </motion.div>
          ) : phase.kind === "error" ? (
            <motion.div key="error" variants={v.fadeUp} initial="hidden" animate="visible" exit="hidden">
              <div className="pt-4">
                <AnalysisError failure={phase.failure} onRetry={retry} />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
