import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteUrl } from "@/lib/site-url";
import { TOKENS } from "@/lib/tokens";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});


export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Farol, o raio-x do seu site em menos de um minuto",
    template: "%s, Farol",
  },
  description:
    "Análise completa de performance, SEO e acessibilidade em menos de um minuto. De graça.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Farol",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: TOKENS.bg,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${geistMono.variable}`}>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
