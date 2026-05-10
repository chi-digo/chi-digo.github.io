import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import { ClientShell } from "@/components/ClientShell";
import { JsonLd } from "@/components/JsonLd";
import { websiteJsonLd } from "@/lib/seo/jsonld";
import "./globals.css";

const fraunces = localFont({
  src: [
    { path: "../public/fonts/fraunces-italic-variable-latin.woff2", style: "normal" },
    { path: "../public/fonts/fraunces-variable-latin.woff2", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
  weight: "100 900",
  adjustFontFallback: false,
});

const sourceSerif = localFont({
  src: "../public/fonts/source-serif-4-variable-latin.woff2",
  variable: "--font-source-serif",
  display: "swap",
  weight: "200 900",
  adjustFontFallback: false,
});

const inter = localFont({
  src: "../public/fonts/inter-variable-latin.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chidigo.org"),
  title: "Chidigo — Building the transmission tools for the Digo language",
  description:
    "Building the transmission tools for the Digo language — dictionary, proverbs, audio, and cultural resources for 600,000 speakers on the Kenya–Tanzania coast.",
  openGraph: {
    title: "Chidigo",
    description:
      "Building the transmission tools for the Digo language.",
    siteName: "Chidigo",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chidigo",
    description:
      "Building the transmission tools for the Digo language.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${sourceSerif.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0E1A2A" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <Script
          id="init-scripts"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: [
              `(function(){try{var s=localStorage.getItem('chidigo-lang');if(s==='sw'||s==='dig'){document.documentElement.lang=s;document.documentElement.classList.add('lang-'+s)}}catch(e){}})()`,
            ].join(';'),
          }}
        />
      </head>
      <body>
        <div id="splash" role="status" aria-label="Loading Chidigo">
          <style dangerouslySetInnerHTML={{ __html: `#splash{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#0E1A2A;animation:splash-auto-hide 5s ease-out forwards}#splash svg{width:80px;height:auto}#splash.fade-out{opacity:0;transition:opacity 400ms ease-out;animation:none;pointer-events:none}@keyframes splash-auto-hide{0%,90%{opacity:1}100%{opacity:0;visibility:hidden}}@media(max-width:399px){#splash svg{width:64px}}@media(prefers-reduced-motion:reduce){#splash{animation:none}#splash.fade-out{transition:none;opacity:0;visibility:hidden}}` }} />
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 144" aria-hidden="true">
            <circle cx="40" cy="16" r="14" fill="#F2EAD7"/>
            <rect x="22" y="38" width="36" height="84" fill="none" stroke="#F2EAD7" strokeWidth="1.5"/>
            <g fill="#F2EAD7">
              <polygon points="22,38 58,38 40,56"/>
              <polygon points="22,74 58,74 40,56"/>
              <polygon points="22,74 58,74 40,92"/>
              <polygon points="22,110 58,110 40,92"/>
              <polygon points="22,110 58,110 40,122"/>
            </g>
          </svg>
        </div>
        <JsonLd data={websiteJsonLd()} />
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
