/**
 * Fetch de URL digitada por usuario, com protecao contra SSRF.
 *
 * O servidor do Farol busca o HTML do site. Sem esta camada, alguem poderia
 * pedir `http://169.254.169.254/` ou um IP interno e usar o Farol pra
 * enxergar a rede de dentro. Cada salto de redirecionamento e revalidado.
 *
 * Limite conhecido: entre o `lookup` e a conexao o DNS pode mudar
 * (rebinding). Para o que o Farol busca (um HTML publico, sem credenciais,
 * com teto de tamanho) o risco residual e aceitavel.
 */

import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { AnalysisError } from "./errors";

const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 11; moto g power) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 FarolBot/1.0";

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

const PRIVATE_V4: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

export function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip);

  if (version === 4) {
    const value = ipv4ToInt(ip);
    return PRIVATE_V4.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
      return (value & mask) === (ipv4ToInt(base) & mask);
    });
  }

  if (version === 6) {
    const lower = ip.toLowerCase();
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return (
      lower === "::" ||
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb") ||
      lower.startsWith("ff")
    );
  }

  return true;
}

export async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (isPrivateAddress(host)) throw new AnalysisError("blocked_url", `endereco interno: ${host}`);
    return;
  }

  let addresses: Array<{ address: string }>;
  try {
    addresses = await lookup(host, { all: true, verbatim: true });
  } catch (error) {
    throw new AnalysisError("unreachable", `dns: ${host} (${(error as NodeJS.ErrnoException).code ?? "erro"})`);
  }

  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new AnalysisError("blocked_url", `dns resolve para endereco interno: ${host}`);
  }
}

export interface SafeResponse {
  status: number;
  finalUrl: string;
  contentType: string;
  body: string;
  redirects: number;
  elapsedMs: number;
}

export async function safeFetchText(
  input: string,
  { timeoutMs = 10_000, maxBytes = 2_000_000, maxRedirects = 5 } = {},
): Promise<SafeResponse> {
  const started = Date.now();
  const signal = AbortSignal.timeout(timeoutMs);
  let current = new URL(input);

  for (let redirects = 0; redirects <= maxRedirects; redirects++) {
    if (current.protocol !== "http:" && current.protocol !== "https:") {
      throw new AnalysisError("blocked_url", `protocolo: ${current.protocol}`);
    }
    if (current.port && !["80", "443", "8080", "8443"].includes(current.port)) {
      throw new AnalysisError("blocked_url", `porta: ${current.port}`);
    }

    await assertPublicHost(current.hostname);

    let response: Response;
    try {
      response = await fetch(current, {
        redirect: "manual",
        signal,
        headers: {
          "user-agent": USER_AGENT,
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          "accept-language": "pt-BR,pt;q=0.9",
        },
      });
    } catch (error) {
      const reason = signal.aborted ? "timeout" : (error as Error).message;
      throw new AnalysisError("unreachable", `fetch: ${reason}`);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new AnalysisError("unreachable", "redirecionamento sem destino");
      current = new URL(location, current);
      continue;
    }

    const body = await readCapped(response, maxBytes);
    return {
      status: response.status,
      finalUrl: current.toString(),
      contentType: response.headers.get("content-type") ?? "",
      body,
      redirects,
      elapsedMs: Date.now() - started,
    };
  }

  throw new AnalysisError("unreachable", "redirecionamentos demais");
}

async function readCapped(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    chunks.push(value);
    if (total >= maxBytes) {
      await reader.cancel();
      break;
    }
  }

  return new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks));
}
