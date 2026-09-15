import { createCn } from "cn/config";

/**
 * Merge de classes com os tokens do Farol registrados.
 *
 * Sem este registro, o merge nao sabe que `text-h1` e tamanho de fonte
 * e trata como cor: `cn("text-h1", "text-ink-500")` descartaria o `text-h1`.
 * Todo tamanho de fonte novo em globals.css precisa entrar aqui.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "h1",
            "h2",
            "h3",
            "body",
            "body-sm",
            "label",
            "mono",
            "input",
            "badge",
            "stat",
            "stat-lg",
            "chrome",
          ],
        },
      ],
    },
  },
});
