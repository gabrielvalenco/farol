import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Arquivos lidos do disco em tempo de execucao (fs.readFile com caminho montado).
   * O rastreamento automatico da Vercel nao enxerga esses caminhos, entao sem isto
   * a imagem de OG quebra (fonte ausente) e os exemplos podem sumir em producao.
   */
  outputFileTracingIncludes: {
    "/api/og": [
      "./node_modules/@fontsource/inter/files/inter-latin-400-normal.woff",
      "./node_modules/@fontsource/inter/files/inter-latin-600-normal.woff",
      "./data/examples/**/*",
      "./data/cases/**/*",
    ],
    "/r/[slug]": ["./data/examples/**/*"],
    "/casos/[slug]": ["./data/examples/**/*", "./data/cases/**/*"],
    "/r/[slug]/print": ["./data/examples/**/*"],
  },
};

export default nextConfig;
