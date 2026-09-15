"use client";

import { Globe } from "lucide-react";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { normalizeUrl } from "@/lib/url";
import { useMotion } from "@/lib/use-motion";
import { cn } from "@/lib/utils";

export interface UrlInputProps {
  /** Recebe a URL ja normalizada (`https://site.com.br/`) e o host sem www. */
  onSubmit?: (url: string, host: string) => void;
  loading?: boolean;
  /** Erro vindo de fora (ex.: servidor). Tem prioridade sobre a validacao local. */
  error?: string | null;
  /**
   * Texto de apoio abaixo do campo. A mensagem de erro ocupa o MESMO espaco,
   * entao aparecer um erro nao empurra o layout.
   */
  hint?: string;
  defaultValue?: string;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Campo de URL, o protagonista da landing (DESIGN.md 6.1).
 */
export function UrlInput({
  onSubmit,
  loading = false,
  error: externalError = null,
  hint,
  defaultValue = "",
  autoFocus,
  className,
}: UrlInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [localError, setLocalError] = useState<string | null>(null);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const { reduced, v } = useMotion();

  const id = useId();
  const inputId = `${id}-input`;
  const messageId = `${id}-message`;

  const error = externalError ?? localError;
  const hasError = Boolean(error);

  function shake() {
    if (reduced || !scope.current) return;
    // Tres oscilacoes em 220ms.
    animate(scope.current, { x: [0, -4, 4, -2, 0] }, { duration: 0.22, ease: "easeInOut" });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const result = normalizeUrl(value);
    if (!result.ok) {
      setLocalError(result.reason === "empty" ? COPY.input.empty : COPY.input.invalid);
      shake();
      return;
    }

    setLocalError(null);
    onSubmit?.(result.url, result.host);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className={cn("w-full max-w-140", className)}>
      <motion.div
        ref={scope}
        className={cn(
          "flex h-14 items-center rounded-md border bg-surface shadow-xs",
          "transition-[border-color,box-shadow] duration-150 ease-out",
          "has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-accent-ring",
          hasError
            ? "border-bad"
            : "border-line hover:border-line-strong has-[input:focus-visible]:border-line-strong",
        )}
      >
        <label htmlFor={inputId} className="sr-only">
          {COPY.input.label}
        </label>
        <Globe aria-hidden size={18} strokeWidth={1.75} className="ml-4 shrink-0 text-ink-400" />
        <input
          id={inputId}
          name="url"
          type="text"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          autoFocus={autoFocus}
          placeholder={COPY.landing.placeholder}
          value={value}
          readOnly={loading}
          onChange={(e) => {
            setValue(e.target.value);
            if (localError) setLocalError(null);
          }}
          aria-invalid={hasError || undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-input text-ink-900 placeholder:text-ink-400 focus-visible:outline-none"
        />
        {/* Raio sm, nao control: 12 do container menos 8 de margem pede um raio menor. */}
        <Button type="submit" loading={loading} className="mr-2 rounded-sm">
          {COPY.landing.submit}
        </Button>
      </motion.div>

      {/* Linha sempre reservada: hint e erro dividem o mesmo espaco,
          entao um erro aparecer ou sumir nunca empurra o layout. */}
      <div className="relative mt-2 min-h-5.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {hasError ? (
            <motion.p
              key="error"
              id={messageId}
              role="alert"
              variants={v.fadeUp}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="text-body-sm text-bad-ink"
            >
              {error}
            </motion.p>
          ) : hint ? (
            <motion.p
              key="hint"
              id={messageId}
              variants={v.fadeIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="text-body-sm text-ink-500"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </form>
  );
}
