import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import { ClientShell } from "@/components/ClientShell";
import { JsonLd } from "@/components/JsonLd";
import { websiteJsonLd } from "@/lib/seo/jsonld";
import "./globals.css";

const fraunces = localFont({
  src: [
    { path: "../public/fonts/fraunces-variable-latin.woff2", style: "normal" },
    { path: "../public/fonts/fraunces-italic-variable-latin.woff2", style: "italic" },
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
        <JsonLd data={websiteJsonLd()} />
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
