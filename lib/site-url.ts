/**
 * URL publica do Farol (metadataBase, imagem de OG).
 *
 * Aceita a variavel vazia, sem protocolo ou invalida sem derrubar o build:
 * uma `NEXT_PUBLIC_SITE_URL=` em branco na Vercel ja quebrou o deploy uma vez.
 */

function parse(value: string | undefined): URL | null {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
}

export function siteUrl(): URL {
  return (
    parse(process.env.NEXT_PUBLIC_SITE_URL) ??
    // Dominio de producao que a propria Vercel informa.
    parse(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    parse(process.env.VERCEL_URL) ??
    new URL("http://localhost:3000")
  );
}
