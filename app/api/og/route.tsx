/**
 * Imagem de OG (DESIGN.md 5.5): 1200x630, fundo --bg-subtle, score gigante
 * na cor da faixa a esquerda, dominio 48/600 a direita, wordmark no rodape.
 * E o que aparece quando o link cai no WhatsApp.
 *
 * Usa `next/og`, que e o @vercel/og empacotado no Next. Satori nao le CSS
 * variable: as cores vem de `lib/tokens.ts`.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { COPY, verdict } from "@/lib/copy";
import { scoreBand } from "@/lib/score";
import { getReport } from "@/lib/storage";
import { TOKENS } from "@/lib/tokens";

export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 };

const BAND = {
  good: { color: TOKENS.good, ink: TOKENS.goodInk, label: "Bom" },
  warn: { color: TOKENS.warn, ink: TOKENS.warnInk, label: "Precisa de atenção" },
  bad: { color: TOKENS.bad, ink: TOKENS.badInk, label: "Crítico" },
} as const;

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 600; style: "normal" }[]> | null = null;

function loadFonts() {
  const dir = path.join(process.cwd(), "node_modules", "@fontsource", "inter", "files");
  fonts ??= Promise.all(
    ([400, 600] as const).map(async (weight) => ({
      name: "Inter",
      data: await readFile(path.join(dir, `inter-latin-${weight}-normal.woff`)),
      weight,
      style: "normal" as const,
    })),
  );
  return fonts;
}

function MarkSvg({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="6" cy="10" r="2" stroke={TOKENS.accent} strokeWidth="1.75" />
      <path d="M9.21 6.17A5 5 0 0 1 9.21 13.83" stroke={TOKENS.accent} strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M11.79 3.11A9 9 0 0 1 11.79 16.89"
        stroke={TOKENS.accent}
        strokeOpacity="0.35"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <MarkSvg />
      <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.03em", color: TOKENS.ink900 }}>Farol</span>
    </div>
  );
}

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug");
  const report = slug ? await getReport(slug).catch(() => null) : null;
  const fontData = await loadFonts();

  const common = {
    ...SIZE,
    fonts: fontData,
    headers: { "cache-control": report ? "public, max-age=86400, immutable" : "public, max-age=3600" },
  };

  if (!report) {
    return new ImageResponse(
      (
        <div
          style={{
            ...SIZE,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 80,
            background: TOKENS.bgSubtle,
            fontFamily: "Inter",
          }}
        >
          <Wordmark />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <span style={{ fontSize: 72, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.05, color: TOKENS.ink900 }}>
              {COPY.landing.title}
            </span>
            <span style={{ fontSize: 32, color: TOKENS.ink500 }}>{COPY.brand.tagline}</span>
          </div>
        </div>
      ),
      common,
    );
  }

  const band = BAND[scoreBand(report.score)];
  const ring = 300;
  const stroke = ring * 0.06;
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return new ImageResponse(
    (
      <div
        style={{
          ...SIZE,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: TOKENS.bgSubtle,
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 72, flex: 1 }}>
          <div style={{ display: "flex", position: "relative", width: ring, height: ring, alignItems: "center", justifyContent: "center" }}>
            <svg width={ring} height={ring} viewBox={`0 0 ${ring} ${ring}`} style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
              <circle cx={ring / 2} cy={ring / 2} r={radius} fill="none" stroke={TOKENS.bgMuted} strokeWidth={stroke} />
              <circle
                cx={ring / 2}
                cy={ring / 2}
                r={radius}
                fill="none"
                stroke={band.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${circumference * (1 - report.score / 100)}`}
              />
            </svg>
            <span style={{ fontSize: 120, fontWeight: 600, letterSpacing: "-0.04em", color: band.ink }}>{report.score}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 28, fontWeight: 600, color: band.ink }}>{band.label}</span>
            <span style={{ fontSize: 48, fontWeight: 600, letterSpacing: "-0.03em", color: TOKENS.ink900, lineHeight: 1.1 }}>
              {report.host}
            </span>
            <span style={{ fontSize: 30, color: TOKENS.ink500, lineHeight: 1.3 }}>{verdict(report.score)}</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Wordmark />
          <span style={{ fontSize: 24, color: TOKENS.ink500 }}>{COPY.brand.tagline}</span>
        </div>
      </div>
    ),
    common,
  );
}
