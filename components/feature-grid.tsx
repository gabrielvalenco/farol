"use client";

import { Accessibility, Gauge, Search, ShieldCheck, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";

import { CATEGORIES, type CategoryKey } from "@/lib/copy";
import { viewportOnce } from "@/lib/motion";
import { useVariants } from "@/lib/use-motion";

const ICONS: Record<CategoryKey, LucideIcon> = {
  performance: Gauge,
  seo: Search,
  accessibility: Accessibility,
  "best-practices": ShieldCheck,
};

const ORDER: CategoryKey[] = ["performance", "seo", "accessibility", "best-practices"];

/**
 * "O que voce recebe" (DESIGN.md 5.1 item 4): quatro itens so em texto,
 * sem card e sem borda. Entram com stagger quando aparecem na tela.
 */
export function FeatureGrid() {
  const v = useVariants();

  return (
    <motion.ul
      className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
      variants={v.stagger}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      {ORDER.map((key) => {
        const Icon = ICONS[key];
        return (
          <motion.li key={key} variants={v.fadeUp} className="flex flex-col gap-2">
            <Icon aria-hidden size={18} strokeWidth={1.75} className="text-ink-400" />
            <h3 className="text-h3">{CATEGORIES[key].label}</h3>
            <p className="text-body-sm text-ink-500">{CATEGORIES[key].description}</p>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
