"use client";

import { ChevronDown } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Accordion (DESIGN.md 5.3 item 6 e 4.2 `collapse`).
 * O Radix ja cuida de aria-expanded, aria-controls e navegacao por teclado.
 * Expansao em CSS: duration.slow + ease.inOut, desligada com reduced motion.
 */
function Accordion(props: ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({ className, ...props }: ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b border-line last:border-b-0", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group flex min-h-11 flex-1 items-center justify-between gap-4 py-3 text-left",
          "text-body font-medium text-ink-900 transition-[color] duration-150",
          "disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden
          size={16}
          strokeWidth={1.75}
          className="shrink-0 text-ink-400 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className={cn(
        "overflow-hidden data-[state=open]:animate-collapse-open",
        // Com forceMount o conteudo fica no DOM (pra impressao abrir tudo, 5.4);
        // na tela, fechado some sem animacao de saida.
        props.forceMount ? "data-[state=closed]:hidden" : "data-[state=closed]:animate-collapse-close",
      )}
      {...props}
    >
      <div className={cn("pb-4 text-body-sm text-ink-700", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
